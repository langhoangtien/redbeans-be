import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import config from "../config";
import { IUser } from "@/modules/user/model";
export interface IGetUserAuthInfoRequest extends Request {
  user?: IUser;
}
const authenticateJWT = (
  req: IGetUserAuthInfoRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(403).json({ message: "Access denied. No token provided." });
    return;
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    if (decoded && typeof decoded !== "string") {
      console.log(decoded);

      req.user = decoded as IUser;
    } else {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    next();
  });
};

export default authenticateJWT;
