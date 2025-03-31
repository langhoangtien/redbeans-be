import mongoose, { mongo } from "mongoose";
import model from "./review.model.js"; // Adjust the import path as necessary
const create = async (req, res) => {
    try {
        const newModel = new model(req.body);
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
        const productId = req.query.productId;
        const rating = parseInt(req.query.rating);
        const purchaseVerified = req.query.purchaseVerified === "true";
        const hasMedia = req.query.hasMedia === "true";
        const sortLiked = req.query.sortLiked;
        const sortCreatedAt = req.query.sortCreatedAt;
        const skip = (page - 1) * limit;
        const filter = {};
        if (productId)
            filter.productId = productId;
        if (!isNaN(rating))
            filter.rating = rating;
        if (req.query.purchaseVerified !== undefined)
            filter.purchaseVerified = purchaseVerified;
        if (hasMedia)
            filter.$or = [
                { images: { $exists: true, $not: { $size: 0 } } },
                { videos: { $exists: true, $not: { $size: 0 } } },
            ];
        // Sắp xếp
        let sort = { createdAt: -1 }; // Mặc định sắp xếp theo ngày mới nhất
        if (sortCreatedAt) {
            sort = { createdAt: sortCreatedAt === "desc" ? -1 : 1 };
        }
        if (sortLiked) {
            sort = { liked: sortLiked === "desc" ? -1 : 1 };
        }
        // Chạy song song để tối ưu hiệu suất
        const [docs, totalDocs] = await Promise.all([
            model.find(filter).sort(sort).skip(skip).limit(limit),
            model.countDocuments(filter),
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid ID format" });
        return;
    }
    try {
        const doc = await model.findById(id);
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
const bulkCreate = async (req, res) => {
    const data = req.body;
    if (!Array.isArray(data) || data.length === 0) {
        res.status(400).json({ message: "Invalid data format" });
        return;
    }
    try {
        const createdDocs = await model.insertMany(data);
        res.status(201).json(createdDocs);
    }
    catch (error) {
        console.error("Error importing documents:", error);
        res.status(500).json({ message: "Server error" });
        return;
    }
};
export default {
    create,
    getAll,
    update,
    remove,
    findOne,
    deleteMany,
    bulkCreate,
};
//# sourceMappingURL=review.controller.js.map