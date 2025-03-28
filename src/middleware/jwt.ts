import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import config from "../config/index.js";
import { IUser } from "../modules/user/user.model.js";
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
      res.status(401).json({ message: "Invalid or expired token." });
      return;
    }

    if (decoded && typeof decoded !== "string") {
      req.user = decoded as IUser;
    } else {
      res.status(401).json({ message: "Invalid token payload." });
      return;
    }

    next();
  });
};

export default authenticateJWT;
