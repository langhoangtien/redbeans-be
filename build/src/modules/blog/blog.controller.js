import mongoose, { mongo } from "mongoose";
import model from "./blog.model.js";
const create = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const newModel = new model({ ...req.body, user: user.userId });
        const newDoc = await newModel.save();
        res.status(201).json(newDoc);
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
const getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search?.trim() || "";
        const skip = (page - 1) * limit;
        let query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } }, // Không phân biệt hoa thường
                { slug: { $regex: search, $options: "i" } },
            ];
        }
        const [docs, totalDocs] = await Promise.all([
            model
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("-content")
                .populate("user", "username fullName _id image"),
            model.countDocuments(query),
        ]);
        res.json({
            data: docs,
            pagination: {
                total: totalDocs,
                page,
                limit,
                totalPages: Math.ceil(totalDocs / limit),
            },
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
const update = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid ID format" });
        return;
    }
    const updateData = { ...req.body, updatedAt: new Date() };
    try {
        const updatedDoc = await model.findByIdAndUpdate(id, updateData, {
            new: true,
        });
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
        const deletedDoc = await model.findByIdAndDelete(id);
        if (!deletedDoc) {
            res.status(404).json({ message: "Document not found" });
            return;
        }
        res.json({ message: "Document deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
const findOne = async (req, res) => {
    const { id } = req.params;
    try {
        let query;
        if (mongoose.Types.ObjectId.isValid(id)) {
            // Nếu ID hợp lệ, tìm theo ID
            query = { _id: id };
        }
        else {
            // Nếu không phải ObjectId, giả sử đó là slug
            query = { slug: id };
        }
        const doc = await model
            .findOne(query)
            .populate("user", "username fullName _id image");
        if (!doc) {
            res.status(404).json({ message: "Document not found" });
            return;
        }
        res.json(doc);
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ message: "Server error" });
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
        const deletedDocs = await model.deleteMany({ _id: { $in: ids } });
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
export default { create, getAll, update, remove, findOne, deleteMany };
//# sourceMappingURL=blog.controller.js.map