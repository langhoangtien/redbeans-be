import jwt from "jsonwebtoken";
import config from "../config/index.js";
const authenticateJWT = (req, res, next) => {
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
            req.user = decoded;
        }
        else {
            res.status(401).json({ message: "Invalid token payload." });
            return;
        }
        next();
    });
};
export default authenticateJWT;
//# sourceMappingURL=jwt.js.map