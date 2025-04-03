import { pino } from "pino";

const isProduction = process.env.APP_MODE === "production";

const logger = pino({
  level: isProduction ? "info" : "debug",
  timestamp: pino.stdTimeFunctions.isoTime, // Hiển thị thời gian đẹp ISO 8601
  ...(isProduction && {
    destination: pino.destination("./logs/app.log"), // Ghi log vào file khi production
  }),
  transport: undefined, // Không sử dụng transport ở cả dev và prod
});

export default logger;
