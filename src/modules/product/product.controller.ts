import mongoose, { mongo } from "mongoose";
import { Request, Response } from "express";
import model from "./product.model";

import VariantModel, { IVariant } from "../variant/variant.model";
interface VariantOption {
  name: string;
  values: string[];
}
const generateVariantCombinations = (
  variantOptions: VariantOption[]
): { name: string; value: string }[][] => {
  if (variantOptions.length === 0) return [];

  return variantOptions.reduce<{ name: string; value: string }[][]>(
    (acc, option) => {
      const { name, values } = option;
      if (acc.length === 0) return values.map((value) => [{ name, value }]);

      return acc.flatMap((prev) =>
        values.map((value) => [...prev, { name, value }])
      );
    },
    []
  );
};
const compareVariant = (
  userVariants: any[],
  variantOptions: VariantOption[]
) => {
  if (variantOptions.length === 0) {
    const variant = userVariants[0];
    variant.attributes = [];
    return [variant];
  }
  const expectedVariants = generateVariantCombinations(variantOptions);

  const finalVariants = expectedVariants.map((expectedVariant) => {
    const matchedVariant = userVariants.find(
      (v: {
        attributes?: { name: string; value: string }[];
        price?: number;
        salePrice?: number;
        stock?: number;
        sku?: string;
      }) =>
        v.attributes &&
        expectedVariant.every(({ name, value }) =>
          v.attributes?.some(
            (attr) => attr.name === name && attr.value === value
          )
        )
    );

    return {
      attributes: expectedVariant,
      price: matchedVariant?.price ?? 0,
      salePrice: matchedVariant?.salePrice ?? 0,
      stock: matchedVariant?.stock ?? 0,
      sku: matchedVariant?.sku ?? "",
    };
  });
  const uniqueVariants = Array.from(
    new Map(
      finalVariants.map((v) => [
        JSON.stringify(v.attributes), // Chuyển attributes thành chuỗi để so sánh
        v,
      ])
    ).values()
  );
  return uniqueVariants;
};
const create = async (req: Request, res: Response) => {
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
    const minPrice = Math.min(...finalVariants.map((variant) => variant.price));
    const newProduct = new model({
      title: parsedData.title,
      description: parsedData.description,
      image: parsedData.image,
      slug: parsedData.slug,
      categories: parsedData.categories,
      images: parsedData.images,
      minPrice,
      variantOptions,
    });

    const variantsWithProductId = finalVariants.map((variant) => ({
      ...variant,
      productId: newProduct._id,
    }));

    const variants = (await VariantModel.insertMany(
      variantsWithProductId
    )) as Array<{
      _id: mongoose.Types.ObjectId;
    }>;
    newProduct.variants = variants.map((v) => v._id.toString());

    await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
      variants,
    });
  } catch (error: any) {
    console.error("Error creating product with variants:", error);
    res.status(400).json({ message: error.message });
    return;
  }
};
const getAll = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const docs = await model
      .find()
      .populate("variants")
      .skip(skip)
      .limit(limit)
      .lean();

    const totalDocs = await model.countDocuments();
    res.json({
      data: docs,
      pagination: {
        total: totalDocs,
        page,
        limit,
        totalPages: Math.ceil(totalDocs / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};
const update = async (req: Request, res: Response) => {
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

    // Cập nhật thông tin sản phẩm
    Object.assign(existingProduct, updateData);

    if (updateData.variantOptions || updateData.variants) {
      const {
        variantOptions,
        minPrice,
        variants: userVariants = [],
      } = updateData;

      if (
        !Array.isArray(variantOptions) ||
        !variantOptions.every((opt) => opt.name && Array.isArray(opt.values))
      ) {
        res.status(400).json({ message: "Invalid variantOptions format" });
        return;
      }

      // Tạo danh sách đầy đủ các biến thể từ variantOptions
      const expectedVariants = generateVariantCombinations(variantOptions);

      const finalVariants = expectedVariants.map((expectedVariant) => {
        const matchedVariant = userVariants.find(
          (v: {
            attributes?: { name: string; value: string }[];
            price?: number;
            salePrice?: number;
            stock?: number;
            sku?: string;
          }) =>
            v.attributes &&
            expectedVariant.every(({ name, value }) =>
              v.attributes?.some(
                (attr) => attr.name === name && attr.value === value
              )
            )
        );

        return {
          attributes: expectedVariant,
          price: matchedVariant?.price ?? minPrice ?? 0,
          salePrice: matchedVariant?.salePrice ?? 0,
          stock: matchedVariant?.stock ?? 0,
          sku: matchedVariant?.sku ?? "",
          productId: id,
        };
      });

      // Xóa variants cũ
      await VariantModel.deleteMany({ productId: id });

      // Loại bỏ biến thể trùng lặp
      const uniqueVariants = Array.from(
        new Map(
          finalVariants.map((v) => [JSON.stringify(v.attributes), v])
        ).values()
      );

      // Chèn các variants mới
      const newVariants = (await VariantModel.insertMany(
        uniqueVariants
      )) as Array<{
        _id: mongoose.Types.ObjectId;
      }>;

      // Cập nhật danh sách variants mới vào sản phẩm
      existingProduct.variants = newVariants.map((v) => v._id.toString());
    }

    // Lưu sản phẩm sau khi cập nhật
    const updatedProduct = await existingProduct.save();

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

const remove = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

const findOne = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }
  try {
    const doc = await model.findById(id).populate("variants");
    if (!doc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }
    res.json(doc);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export default { create, getAll, update, remove, findOne };
