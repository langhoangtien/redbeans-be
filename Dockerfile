# Giai đoạn Build: Biên dịch mã nguồn TypeScript và chuẩn bị môi trường
FROM node:22.12.0-alpine AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file package.json và package-lock.json để cài đặt dependencies
COPY package.json package-lock.json ./

# Cài đặt tất cả dependencies (bao gồm cả devDependencies)
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Biên dịch TypeScript sang JavaScript
RUN npm run build


# Giai đoạn Production: Tạo container chỉ chứa file cần thiết
FROM node:22.12.0-alpine

# Đặt NODE_ENV để chỉ cài đặt production dependencies
ENV NODE_ENV=production

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file package.json và package-lock.json
COPY package.json package-lock.json ./

# Cài đặt chỉ production dependencies
RUN npm install --production

# Copy các file đã biên dịch từ giai đoạn builder
COPY --from=builder /app/dist ./dist

# Copy các file cần thiết khác (nếu có, ví dụ: file .env hoặc static files)
COPY .env ./

# Mở port ứng dụng
EXPOSE 3000

# Lệnh khởi chạy ứng dụng
CMD ["node", "dist/index.js"]
