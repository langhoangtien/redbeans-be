import { Request, Response } from "express";
import User, { IUser } from "../user/model";
import config from "@/config";
import jwt from "jsonwebtoken";
import { comparePassword } from "@/utilities";

const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user || !user.password || !password) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordCorrect = comparePassword(
      password,
      user.salt || "",
      user.password
    );
    if (!isPasswordCorrect) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        _id: user._id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user: IUser | null = await User.findById(req.user.userId).select(
      "-password -salt"
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};

export default { login, me };
