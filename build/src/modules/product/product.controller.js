import mongoose from "mongoose";
import model from "./product.model.js";
import VariantModel from "../variant/variant.model.js";
const getMinPrice = (variants) => {
    if (variants.length === 0)
        return { minPrice: 0, compareAtPrice: 0 };
    let minPrice = variants[0].price;
    let minCompareAtPrice = variants[0].compareAtPrice;
    for (let i = 1; i < variants.length; i++) {
        if (variants[i].price < minPrice) {
            minPrice = variants[i].price;
        }
        if (variants[i].compareAtPrice < minCompareAtPrice) {
            minCompareAtPrice = variants[i].compareAtPrice;
        }
    }
    return { minPrice, minCompareAtPrice };
};
const generateVariantCombinations = (variantOptions) => {
    if (variantOptions.length === 0)
        return [];
    return variantOptions.reduce((acc, option) => {
        const { name, values } = option;
        if (acc.length === 0)
            return values.map((value) => [{ name, value }]);
        return acc.flatMap((prev) => values.map((value) => [...prev, { name, value }]));
    }, []);
};
const compareVariant = (userVariants, variantOptions, productId) => {
    if (variantOptions.length === 0) {
        const variant = userVariants[0];
        variant.attributes = [];
        variant.productId = productId;
        return [variant];
    }
    const expectedVariants = generateVariantCombinations(variantOptions);
    const finalVariants = expectedVariants.map((expectedVariant) => {
        const matchedVariant = userVariants.find((v) => v.attributes &&
            expectedVariant.every(({ name, value }) => v.attributes?.some((attr) => attr.name === name && attr.value === value)));
        return {
            attributes: expectedVariant,
            price: matchedVariant?.price ?? 0,
            compareAtPrice: matchedVariant?.compareAtPrice ?? 0,
            stock: matchedVariant?.stock ?? 0,
            sku: matchedVariant?.sku ?? "",
            productId,
        };
    });
    const uniqueVariants = Array.from(new Map(finalVariants.map((v) => [
        JSON.stringify(v.attributes), // Chuyển attributes thành chuỗi để so sánh
        v,
    ])).values());
    return uniqueVariants;
};
const create = async (req, res) => {
    try {
        const parsedData = req.body;
        if (!Array.isArray(parsedData.variantOptions)) {
            res.status(400).json({ message: "Invalid variant options" });
            return;
        }
        const { variantOptions } = parsedData;
        const userVariants = Array.isArray(parsedData.variants)
            ? parsedData.variants
            : [];
        const finalVariants = compareVariant(userVariants, variantOptions);
        // Tính toán giá thấp nhất từ các biến thể
        const { minPrice, minCompareAtPrice } = getMinPrice(finalVariants);
        const newProduct = new model({
            name: parsedData.name,
            description: parsedData.description,
            image: parsedData.image,
            slug: parsedData.slug,
            categories: parsedData.categories,
            images: parsedData.images,
            minPrice,
            minCompareAtPrice,
            variantOptions,
        });
        const variantsWithProductId = finalVariants.map((variant) => ({
            ...variant,
            productId: newProduct._id,
        }));
        const variants = (await VariantModel.insertMany(variantsWithProductId));
        newProduct.variants = variants.map((v) => v._id.toString());
        await newProduct.save();
        res.status(201).json({
            message: "Product created successfully",
            product: newProduct,
            variants,
        });
    }
    catch (error) {
        console.error("Error creating product with variants:", error);
        res.status(400).json({ message: error.message });
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
                .populate("variants")
                .select("-description"),
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
    const updateData = req.body;
    try {
        const existingProduct = await model.findById(id);
        if (!existingProduct) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        // Cập nhật thông tin sản phẩm khi không có biến thể mới
        if (updateData.variants[0]._id) {
            const { variants } = updateData;
            const cloneUpdate = { ...updateData };
            delete cloneUpdate.variants;
            delete cloneUpdate.variantOptions;
            const updatedVariants = await Promise.all(variants.map(async (variant) => {
                const existingVariant = await VariantModel.findById(variant._id);
                if (!existingVariant) {
                    return null;
                }
                Object.assign(existingVariant, variant, { productId: id });
                return existingVariant.save();
            }));
            const { minPrice, minCompareAtPrice } = getMinPrice(updatedVariants);
            Object.assign(existingProduct, cloneUpdate, {
                minPrice,
                minCompareAtPrice,
            });
            const updatedProduct = await existingProduct.save();
            res.json({
                message: "Product updated successfully",
                product: updatedProduct,
                variants: updatedVariants,
            });
            return;
        }
        // Cập nhật thông tin sản phẩm nếu có biến thể mới
        Object.assign(existingProduct, updateData);
        if (updateData.variantOptions || updateData.variants) {
            console.log("Updating variants", updateData);
            const { variantOptions, variants: userVariants = [], } = updateData;
            if (!Array.isArray(variantOptions) ||
                !variantOptions.every((opt) => opt.name && Array.isArray(opt.values))) {
                res.status(400).json({ message: "Invalid variantOptions format" });
                return;
            }
            const uniqueVariants = compareVariant(userVariants, variantOptions, id);
            const { minPrice, minCompareAtPrice } = getMinPrice(uniqueVariants);
            // Xóa variants cũ
            await VariantModel.deleteMany({ productId: id });
            // Chèn các variants mới
            const newVariants = (await VariantModel.insertMany(uniqueVariants));
            // Cập nhật danh sách variants mới vào sản phẩm
            existingProduct.variants = newVariants.map((v) => v._id.toString());
            existingProduct.minPrice = minPrice;
            existingProduct.minCompareAtPrice = minCompareAtPrice;
        }
        // Lưu sản phẩm sau khi cập nhật
        const updatedProduct = await existingProduct.save();
        res.json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
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
        await VariantModel.deleteMany({ productId: id });
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
        const doc = await model.findOne(query).populate("variants");
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
        await VariantModel.deleteMany({
            productId: { $in: ids },
        });
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
//# sourceMappingURL=product.controller.js.map