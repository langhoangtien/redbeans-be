import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
const crypto = require("crypto");
// Hàm validate chung cho tất cả các schema
export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate dữ liệu từ client bằng Zod
      schema.parse(req.body); // Nếu không hợp lệ, Zod sẽ ném lỗi

      // Nếu dữ liệu hợp lệ, gọi next() để tiếp tục tới route handler
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        // Nếu lỗi là từ Zod, trả về lỗi validation
        res.status(400).json({
          message: "Validation failed",
          errors: error.errors, // Trả về chi tiết lỗi
        });
      } else if (error instanceof Error) {
        // Nếu lỗi là một error thông thường
        res.status(500).json({
          message: "Server error",
          error: error.message,
        });
      } else {
        // Nếu là lỗi không xác định
        res.status(500).json({
          message: "Unknown error occurred",
        });
      }
      // Không cần gọi next() ở đây vì đã trả về response
    }
  };
};

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex"); // Tạo salt ngẫu nhiên
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex"); // Hash mật khẩu với thuật toán PBKDF2

  return { salt, hash };
};
export const comparePassword = (
  password: string,
  storedSalt: string,
  storedHash: string
) => {
  // Hash mật khẩu nhập vào bằng salt đã lưu
  const hash = crypto
    .pbkdf2Sync(password, storedSalt, 1000, 64, "sha512")
    .toString("hex");

  // So sánh hash mật khẩu đã nhập với hash đã lưu trong cơ sở dữ liệu
  return hash === storedHash;
};

// Ví dụ sử dụng
// const { salt, hash } = hashPassword("mySecretPassword123");

// // So sánh mật khẩu nhập vào (đây là mật khẩu người dùng sẽ nhập khi đăng nhập)
// const isPasswordCorrect = comparePassword("mySecretPassword123", salt, hash);
// console.log(isPasswordCorrect); // true nếu mật khẩu đúng, false nếu sai
