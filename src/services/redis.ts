import { Redis } from "ioredis";
import dotenv from "dotenv";
import config from "../config/index.js";

dotenv.config(); // Load biến môi trường từ .env

// Kết nối đến Redis (chạy trong Docker)
const redis = new Redis({
  host: config.redisHost, // Dùng tên service trong docker-compose
  port: Number(config.redisPort), // Cổng Redis
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000), // Thử lại khi lỗi
});

// Log trạng thái Redis
redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));
redis.on("end", () => console.warn("⚠️ Redis connection closed"));

export default redis;
