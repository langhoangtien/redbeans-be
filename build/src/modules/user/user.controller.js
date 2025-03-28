import User from "./user.model.js";
import mongoose, { mongo } from "mongoose";
import { hashPassword } from "../../utilities/index.js";
const create = async (req, res) => {
    try {
        const userDto = { ...req.body };
        const { salt, hash } = hashPassword(userDto.password);
        userDto.salt = salt;
        userDto.password = hash;
        const newModel = new User(userDto);
        const newDoc = await newModel.save();
        res.status(201).json(newDoc);
        return;
    }
    catch (error) {
        if (error instanceof mongo.MongoServerError && error.code === 11000) {
            const duplicateKey = Object.keys(error.keyValue)[0];
            res.status(400).json({
                message: `${duplicateKey} already exists: ${error.keyValue[duplicateKey]}`,
            });
            return;
        }
        console.error("Error creating document:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
const findOne = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid ID format" });
        return;
    }
    try {
        const doc = await User.findById(id).select("-password -salt");
        if (!doc) {
            res.status(404).json({ message: "Document not found" });
            return;
        }
        res.json(doc);
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
const getAll = async (req, res) => {
    try {
        let page = Math.max(parseInt(req.query.page) || 1, 1);
        let limit = Math.max(parseInt(req.query.limit) || 10, 1);
        const search = req.query.search?.trim() || "";
        const skip = (page - 1) * limit;
        // Tạo điều kiện tìm kiếm
        let query = {};
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: "i" } }, // Không phân biệt hoa thường
                { email: { $regex: search, $options: "i" } },
                { fullName: { $regex: search, $options: "i" } },
            ];
        }
        // Chạy song song để tối ưu truy vấn
        const [docs, totalDocs] = await Promise.all([
            User.find(query).skip(skip).limit(limit).select("-password -salt"),
            User.countDocuments(query),
        ]);
        // Tính tổng số trang
        const totalPages = Math.ceil(totalDocs / limit);
        if (page > totalPages)
            page = totalPages || 1; // Nếu vượt quá, set về trang cuối cùng
        res.json({
            data: docs,
            pagination: { total: totalDocs, page, limit, totalPages },
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const update = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid ID format" });
        return;
    }
    const updateData = { ...req.body };
    if (updateData.password) {
        const { salt, hash } = hashPassword(req.body.password);
        updateData.salt = salt;
        updateData.password = hash;
    }
    try {
        const updatedDoc = await User.findByIdAndUpdate(id, updateData, {
            new: true,
        }).select("-password -salt");
        if (!updatedDoc) {
            res.status(404).json({ message: "Document not found" });
            return;
        }
        res.json(updatedDoc);
    }
    catch (error) {
        console.error("Error updating document:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
const remove = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid ID format" });
        return;
    }
    try {
        const deletedDoc = await User.findByIdAndDelete(id);
        if (!deletedDoc) {
            res.status(404).json({ message: "Document not found" });
        }
        res.json({ message: "Document deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
const deleteMany = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ message: "Invalid IDs format" });
        return;
    }
    if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        res.status(400).json({ message: "One or more IDs are invalid" });
        return;
    }
    try {
        const deletedDocs = await User.deleteMany({ _id: { $in: ids } });
        if (deletedDocs.deletedCount === 0) {
            res.status(404).json({ message: "Document not found" });
            return;
        }
        res.json({ message: "Documents deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting documents:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
const combineControllers = {
    create,
    update,
    findOne,
    getAll,
    remove,
    deleteMany,
};
export default combineControllers;
//# sourceMappingURL=user.controller.js.map