import mongoose from "mongoose";
import { Request, Response } from "express";
import model, { IVariantOption } from "./product.model.js";

import VariantModel, {
  IVariant,
  IVariantAttribute,
  IVariantRequest,
} from "../variant/variant.model.js";
import { calculateAverageRating } from "../../utilities/index.js";

const getValidOptions = (options: IVariantOption[]) => {
  const seenNames = new Set<string>();

  return options.filter((option) => {
    const isValid =
      option.name.trim() !== "" &&
      option.key.trim() !== "" &&
      option.values.length > 0;

    const isDuplicate = seenNames.has(option.name.trim());

    if (isValid && !isDuplicate) {
      seenNames.add(option.name.trim());
      return true;
    }

    return false;
  });
};

const getMinPrice = (variants: { price: number; compareAtPrice: number }[]) => {
  if (variants.length === 0) return { minPrice: 0, compareAtPrice: 0 };
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
const generateVariantCombinations = (
  variantOptions: IVariantOption[]
): IVariantRequest[] => {
  if (variantOptions.length === 0) return [];

  const filteredOptions = getValidOptions(variantOptions);
  const valuesList = filteredOptions.map((option) =>
    option.values.map((val) => ({
      key: option.key,
      name: option.name,
      value: val.value,
      title: val.title,
      image: val.image,
      color: val.color,
      price: val.price,
      compareAtPrice: val.compareAtPrice,
    }))
  );

  const generateCombinations = (
    lists: IVariantAttribute[][]
  ): IVariantAttribute[][] => {
    if (lists.length === 0) return [];

    return lists.reduce<IVariantAttribute[][]>((acc, currentList) => {
      if (acc.length === 0) return currentList.map((item) => [item]);

      return acc.flatMap((accItem) =>
        currentList.map((currItem) => [...accItem, currItem])
      );
    }, []);
  };

  const variantCombinations = generateCombinations(valuesList);
  const variants = variantCombinations.map((attributes) => ({
    attributes,
    price: 0,
    compareAtPrice: 0,
    stock: 0,
    sku: "",
    image: "",
    title: attributes.map((attr) => attr.title).join(", "),
    key: attributes.map((attr) => attr.title).join(" - "),
  }));
  return variants;
};
const compareVariant = (
  userVariants: IVariantRequest[],
  variantOptions: IVariantOption[],
  productId?: string
) => {
  if (variantOptions.length === 0) {
    const variant = userVariants[0];
    variant.attributes = [];
    variant.productId = productId;

    return [variant];
  }
  const expectedVariants = generateVariantCombinations(variantOptions);
  const mappedVariants = expectedVariants.map((variant) => {
    const matchedVariant = userVariants.find(
      (userVariant) => userVariant.key === variant.key
    );
    if (matchedVariant) {
      return {
        attributes: variant.attributes,
        price: matchedVariant.price,
        compareAtPrice: matchedVariant.compareAtPrice,
        stock: matchedVariant.stock,
        sku: matchedVariant.sku,
        image: matchedVariant.image,
        title: matchedVariant.title,
        productId: productId,
      };
    }
    return variant;
  });

  return mappedVariants;
};
const create = async (req: Request, res: Response) => {
  try {
    const parsedData = req.body;
    if (!Array.isArray(parsedData.variantOptions)) {
      res.status(400).json({ message: "Invalid variant options" });
      return;
    }

    const userVariants = Array.isArray(parsedData.variants)
      ? parsedData.variants
      : [];

    const finalVariants = compareVariant(
      userVariants,
      parsedData.variantOptions
    );
    // Tính toán giá thấp nhất từ các biến thể
    const { minPrice, minCompareAtPrice } = getMinPrice(finalVariants);
    const { totalRating, averageRating } = calculateAverageRating(
      parsedData.rating
    );
    const newProduct = new model({
      name: parsedData.name,
      description: parsedData.description,
      image: parsedData.image,
      slug: parsedData.slug,
      categories: parsedData.categories,
      variantOptions: parsedData.variantOptions,
      images: parsedData.images,
      minPrice,
      minCompareAtPrice,
      accordion: parsedData.accordion,
      accordionItems: parsedData.accordionItems,
      introduction: parsedData.introduction,
      collections: parsedData.collections,
      rating: parsedData.rating,
      averageRating,
      totalRating,
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
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    let query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const [docs, totalDocs] = await Promise.all([
      model
        .find(query)
        .sort({ [sortBy]: sortOrder, _id: 1 })
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
  const { totalRating, averageRating } = calculateAverageRating(
    updateData.rating
  );
  updateData.totalRating = totalRating;
  updateData.averageRating = averageRating;

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
          const price = variant.price || 0;
          const compareAtPrice = variant.compareAtPrice || 0;
          const stock = variant.stock || 0;
          const sku = variant.sku || "";
          const image = variant.image || "";
          const title = variant.title || "";

          Object.assign(
            existingVariant,
            {
              price,
              compareAtPrice,
              stock,
              sku,
              image,
              title,
            },
            { productId: id }
          );
          return existingVariant.save();
        })
      );
      const { minPrice, minCompareAtPrice } = getMinPrice(
        updatedVariants as any
      );
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
      const { variantOptions, variants: userVariants = [] } = updateData;

      if (
        !Array.isArray(variantOptions) ||
        !variantOptions.every((opt) => opt.name && Array.isArray(opt.values))
      ) {
        res.status(400).json({ message: "Invalid variantOptions format" });
        return;
      }

      const uniqueVariants = compareVariant(userVariants, variantOptions, id);
      const { minPrice, minCompareAtPrice } = getMinPrice(uniqueVariants);
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
      existingProduct.minCompareAtPrice = minCompareAtPrice;
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

  try {
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Nếu ID hợp lệ, tìm theo ID
      query = { _id: id };
    } else {
      // Nếu không phải ObjectId, giả sử đó là slug
      query = { slug: id };
    }

    const doc = await model.findOne(query).populate("variants");

    if (!doc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    res.json(doc);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Server error" });
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
