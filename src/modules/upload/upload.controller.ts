import { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const LIMIT_SIZE = 5 * 1024 * 1024; // 2MB
// Cấu hình Multer để upload file
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMIT_SIZE }, // 500KB
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/avif",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ định dạng JPEG, PNG, WEBP, JPG, AVIF max 5MB!"));
    }
  },
});

const sizes = [100, 250, 400, 800, 1500];
const outputDir = "uploads";

const ensureDirExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const uploadMultiple = async (req: Request, res: Response) => {
  try {
    if (!req.files || !(req.files instanceof Array)) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const monthDir = path.join(outputDir, `${year}-${month}`);
    ensureDirExists(monthDir);

    const processedImages = await Promise.all(
      req.files.map(async (file: Express.Multer.File) => {
        const fileId = uuidv4();
        // const convertedFiles: string[] = [];
        const fileID = `${year}-${month}-${fileId}`;
        await Promise.all(
          sizes.map(async (size) => {
            const fileName = `${year}-${month}-${fileId}-${size}.avif`;
            const filePath = path.join(monthDir, fileName);
            await sharp(file.buffer)
              .resize(size, size, { fit: "inside" })
              .toFormat("avif")
              .toFile(filePath);
          })
        );

        return fileID;
      })
    );

    res.json({ message: "Upload successful", files: processedImages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi xử lý hình ảnh" });
    return;
  }
};

const uploadSingle = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "Vui lòng tải lên một tệp ảnh hợp lệ!" });
    return;
  }

  try {
    const file = req.file;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const monthDir = path.join(outputDir, `${year}-${month}`);
    ensureDirExists(monthDir);
    // Xử lý từng kích thước
    const fileId = uuidv4();
    // const convertedFiles: string[] = [];
    const fileID = `${year}-${month}-${fileId}`;
    await Promise.all(
      sizes.map(async (size) => {
        const fileName = `${year}-${month}-${fileId}-${size}.avif`;
        const filePath = path.join(monthDir, fileName);
        await sharp(file.buffer)
          .resize(size, size, { fit: "inside" })
          .toFormat("avif")
          .toFile(filePath);
      })
    );

    const output = fileID;

    res.json({ message: "Tải lên và chuyển đổi thành công!", file: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi xử lý ảnh" });
    return;
  }
};
const allowedExtensions = [".avif", ".jpg", ".jpeg", ".png", ".webp"];

const getFile = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || id.length < 10) {
    res.status(400).json({ error: "Invalid file ID" });
    return;
  }

  try {
    const parts = id.split("-");
    if (parts.length < 3) {
      res.status(400).json({ error: "Invalid file ID" });
      return;
    }

    const folder = `${parts[0]}-${parts[1]}`; // YYYY-MM
    const filePath = path.join(UPLOAD_DIR, folder, id);

    // Kiểm tra phần mở rộng file
    const ext = path.extname(filePath).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      res.status(403).json({ error: "Forbidden file type" });
      return;
    }

    // Kiểm tra nếu file tồn tại
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    res.setHeader("Content-Type", "image/avif");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    res.sendFile(filePath, (err) => {
      if (err) {
        console.log("filePath", filePath);

        res.status(500).json({ error: "Error sending file" });
        return;
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export default { upload, uploadMultiple, getFile, uploadSingle };
