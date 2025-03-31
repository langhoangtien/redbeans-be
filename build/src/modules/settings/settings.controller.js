import model from "./setting.model.js";
const get = async (_req, res) => {
    try {
        const settings = await model.findOne({});
        if (!settings) {
            res.status(200).json({});
            return;
        }
        res.status(200).json(settings);
        return;
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
// Cập nhật settings (Tạo mới nếu chưa có)
const update = async (req, res) => {
    const data = req.body;
    try {
        const updatedSettings = await model.findOneAndUpdate({}, data, {
            new: true,
            upsert: true, // Tạo mới nếu chưa có
        });
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