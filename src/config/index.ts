import dotenv from "dotenv";
dotenv.config();

// Cấu hình ứng dụng
export default {
  port: process.env.PORT || 3000,
  dbUser: process.env.DATABASE_USERNAME,
  dbPassword: process.env.DATABASE_PASSWORD,
  dbPort: process.env.DATABASE_PORT || 27017,
  dbUri: process.env.MONGO_URI || "mongodb://localhost:27017/myapp",
  logLevel: process.env.LOG_LEVEL || "info",
  jwtSecret: process.env.JWT_SECRET || "your_secret",
  jwtExpiration: process.env.JWT_EXPIRATION || "1h",
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  paypalApi: process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com",
  paypalMode: process.env.PAYPAL_MODE || "sandbox",
};
