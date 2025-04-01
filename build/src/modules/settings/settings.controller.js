import model from "./setting.model.js";
import { redis } from "../../main.js";
const REDIS_KEY = "app_settings";
const get = async (_req, res) => {
    try {
        const cachedSettings = await redis.get(REDIS_KEY);
        if (cachedSettings) {
            res.status(200).json(JSON.parse(cachedSettings));
            return;
        }
        const settings = await model.findOne({});
        if (!settings) {
            res.status(200).json({});
            return;
        }
        await redis.set(REDIS_KEY, JSON.stringify(settings));
        res.status(200).json(settings);
        return;
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
export const getSettings = async () => {
    // Kiểm tra dữ liệu trong Redis trước
    const cachedSettings = await redis.get(REDIS_KEY);
    if (cachedSettings) {
        return JSON.parse(cachedSettings);
    }
    // Nếu không có trong Redis, lấy từ MongoDB
    const settings = await model.findOne({});
    if (!settings)
        return null; // Không lưu vào Redis nếu không có dữ liệu
    // Lưu vào Redis để dùng lại sau
    await redis.set(REDIS_KEY, JSON.stringify(settings));
    return settings;
};
// Cập nhật settings (Tạo mới nếu chưa có)
const update = async (req, res) => {
    const data = req.body;
    try {
        const updatedSettings = await model.findOneAndUpdate({}, data, {
            new: true,
            upsert: true, // Tạo mới nếu chưa có
        });
        await redis.set(REDIS_KEY, JSON.stringify(updatedSettings));
        res.status(200).json(updatedSettings);
        return;
    }
    catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
export default { get, update };
//# sourceMappingURL=settings.controller.js.map