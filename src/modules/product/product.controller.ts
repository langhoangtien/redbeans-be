import mongoose from "mongoose";
import { Request, Response } from "express";
import model from "./product.model";

import VariantModel, { IVariant } from "../variant/variant.model";

interface VariantOption {
  name: string;
  values: string[];
}
const getMinPrice = (variants: { price: number; salePrice: number }[]) => {
  if (variants.length === 0) return { minPrice: 0, minSalePrice: 0 };
  let minPrice = variants[0].price;
  let minSalePrice = variants[0].salePrice;
  for (let i = 1; i < variants.length; i++) {
    if (variants[i].price < minPrice) {
      minPrice = variants[i].price;
    }
    if (variants[i].salePrice < minSalePrice) {
      minSalePrice = variants[i].salePrice;
    }
  }
  return { minPrice, minSalePrice };
};
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
  variantOptions: VariantOption[],
  productId?: string
) => {
  if (variantOptions.length === 0) {
    const variant = userVariants[0];
    variant.attributes = [];
    variant.productId = productId;
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
      productId,
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
    const { minPrice, minSalePrice } = getMinPrice(finalVariants);
    const newProduct = new model({
      name: parsedData.name,
      description: parsedData.description,
      image: parsedData.image,
      slug: parsedData.slug,
      categories: parsedData.categories,
      images: parsedData.images,
      minPrice,
      minSalePrice,
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

    const search = (req.query.search as string)?.trim() || "";
    const skip = (page - 1) * limit;

    let query: any = {};
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
        .populate("variants"),
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

    // Cập nhật thông tin sản phẩm khi không có biến thể mới
    if (updateData.variants[0]._id) {
      const { variants } = updateData;
      const cloneUpdate = { ...updateData };
      delete cloneUpdate.variants;
      delete cloneUpdate.variantOptions;
      const updatedVariants = await Promise.all(
        variants.map(async (variant: IVariant) => {
          const existingVariant = await VariantModel.findById(variant._id);
          if (!existingVariant) {
            return null;
          }
          Object.assign(existingVariant, variant, { productId: id });
          return existingVariant.save();
        })
      );
      const { minPrice, minSalePrice } = getMinPrice(updatedVariants as any);
      Object.assign(existingProduct, cloneUpdate, { minPrice, minSalePrice });
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

      const {
        variantOptions,

        variants: userVariants = [],
      } = updateData;

      if (
        !Array.isArray(variantOptions) ||
        !variantOptions.every((opt) => opt.name && Array.isArray(opt.values))
      ) {
        res.status(400).json({ message: "Invalid variantOptions format" });
        return;
      }

      const uniqueVariants = compareVariant(userVariants, variantOptions, id);
      const { minPrice, minSalePrice } = getMinPrice(uniqueVariants);
      // Xóa variants cũ
      await VariantModel.deleteMany({ productId: id });

      // Chèn các variants mới
      const newVariants = (await VariantModel.insertMany(
        uniqueVariants
      )) as Array<{
        _id: mongoose.Types.ObjectId;
      }>;

      // Cập nhật danh sách variants mới vào sản phẩm
      existingProduct.variants = newVariants.map((v) => v._id.toString());
      existingProduct.minPrice = minPrice;
      existingProduct.minSalePrice = minSalePrice;
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

const deleteMany = async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ message: "Invalid IDs format" });
    return;
  }
  if (!ids.every((id: any) => mongoose.Types.ObjectId.isValid(id))) {
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
  } catch (error) {
    console.error("Error deleting documents:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};
export default { create, getAll, update, remove, findOne, deleteMany };
