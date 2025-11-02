import mongoose, { mongo } from "mongoose";
import { Request, Response } from "express";
import fs from "fs/promises";
import ProductRating from "../product/product-rating.model.js";
import model from "./review.model.js"; // Adjust the import path as necessary
import path from "path";
import sharp from "sharp";

/** ================================
 * Helpers
 * ================================ */
function computeHasMedia(doc: any) {
  return !!(
    (doc?.images?.length ?? 0) > 0 ||
    (doc?.videos?.length ?? 0) > 0 ||
    (doc?.imageUploads?.length ?? 0) > 0 ||
    (doc?.videoUploads?.length ?? 0) > 0
  );
}

function countMedia(doc: any) {
  const photos = (doc?.images?.length ?? 0) + (doc?.imageUploads?.length ?? 0);
  const videos = (doc?.videos?.length ?? 0) + (doc?.videoUploads?.length ?? 0);
  const media = photos + videos;
  const rwMedia = media > 0 ? 1 : 0; // review này có ít nhất 1 media
  return { photos, videos, media, rwMedia };
}

/** ================================
 * CREATE
 * ================================ */
const create = async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };
    body.hasMedia = computeHasMedia(body);

    const newModel = new model(body);
    const newDoc = await newModel.save();
    await applyAddStats(newDoc);
    res.status(201).json(newDoc);
  } catch (error: any) {
    if (error instanceof mongo.MongoServerError && error.code === 11000) {
      const duplicateKey = Object.keys(error.keyValue)[0];
      res.status(400).json({
        message: `${duplicateKey} already exists: ${error.keyValue[duplicateKey]}`,
      });
      return;
    }
    console.error("Error creating document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** ================================
 * GET ALL
 * ================================ */
const getAll = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const search = (req.query.search as string)?.trim() || "";
    const limit = parseInt(req.query.limit as string) || 10;
    const productId = req.query.productId as string;
    const rating = parseInt(req.query.rating as string);
    const purchaseVerified = req.query.purchaseVerified === "true";
    const hasMedia = req.query.hasMedia === "true";
    const sortBy = (req.query.sortBy as string) || ""; // không mặc định ở đây nữa
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;
    const filter: any = {};
    const and: any[] = [];

    if (productId) filter.productId = productId;
    if (!isNaN(rating)) filter.rating = rating;
    if (req.query.purchaseVerified !== undefined)
      filter.purchaseVerified = purchaseVerified;
    if (hasMedia) and.push({ hasMedia: true });

    if (search) {
      and.push({
        $or: [
          { customer: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
          { productId: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (and.length) filter.$and = and;

    // ----------------------------
    // 🔹 Logic sắp xếp linh hoạt
    // ----------------------------
    let sortConfig: any = {};

    if (!sortBy) {
      // Không truyền sortBy → mặc định ưu tiên media rồi ngày tạo
      sortConfig = { hasMedia: -1, createdAt: -1, _id: 1 };
    } else {
      // Có sortBy (vd: rating) → trong nhóm cùng rating:
      //   1) ưu tiên media
      //   2) mới trước
      //   3) ổn định bằng _id
      sortConfig = { [sortBy]: sortOrder, hasMedia: -1, createdAt: -1, _id: 1 };
    }

    const [docs, totalDocs] = await Promise.all([
      model.find(filter).sort(sortConfig).skip(skip).limit(limit),
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
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** ================================
 * UPDATE
 * ================================ */
const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }

  const updateData = { ...req.body, updatedAt: new Date() };
  updateData.hasMedia = computeHasMedia(updateData);

  try {
    const oldDoc = await model.findById(id);
    if (!oldDoc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    const updatedDoc = await model.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedDoc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    await applyUpdateStats(oldDoc, updatedDoc);
    res.json(updatedDoc);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** ================================
 * DELETE ONE
 * ================================ */
export const remove = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }

  try {
    // 1️⃣ Lấy review trước khi xoá (để biết file nào cần xoá)
    const deletedDoc = await model.findByIdAndDelete(id);
    if (!deletedDoc) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    // 2️⃣ Lấy danh sách file cần xoá
    const fileList = deletedDoc.imageIds?.length > 0 ? deletedDoc.imageIds : [];

    // 3️⃣ Xóa file ảnh (không dùng existsSync, chỉ bắt lỗi ENOENT)
    await Promise.all(
      fileList.map(async (filename) => {
        const filePath = path.join(uploadsDir, filename);
        try {
          await fs.unlink(filePath);
        } catch (err: any) {
          if (err.code !== "ENOENT")
            console.error(`Delete failed: ${filename}`, err);
        }
      })
    );

    // 4️⃣ Cập nhật thống kê sản phẩm
    await applyRemoveStats(deletedDoc);

    res.json({ message: "Review deleted successfully" });
    return;
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};
/** ================================
 * FIND ONE
 * ================================ */
const findOne = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** ================================
 * DELETE MANY
 * ================================ */
export const deleteMany = async (req: Request, res: Response) => {
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
    // 1️⃣ Lấy trước danh sách review để biết file nào và productId nào cần update
    const docs = await model.find({ _id: { $in: ids } }).lean();

    // 2️⃣ Xóa file ảnh trên ổ đĩa (song song)
    await Promise.all(
      docs.flatMap((doc) => {
        const fileList = doc.imageIds?.length > 0 ? doc.imageIds : [];
        return fileList.map(async (filename: string) => {
          const filePath = path.join(uploadsDir, filename);
          try {
            await fs.unlink(filePath);
          } catch (err: any) {
            if (err.code !== "ENOENT")
              console.error(`Delete failed: ${filename}`, err);
          }
        });
      })
    );

    // 3️⃣ Xóa dữ liệu trong MongoDB
    const deleted = await model.deleteMany({ _id: { $in: ids } });
    if (deleted.deletedCount === 0) {
      res.status(404).json({ message: "Documents not found" });
      return;
    }

    // 4️⃣ Gom thống kê cập nhật cho từng productId
    const byProduct: Record<string, any> = {};
    for (const d of docs) {
      const pid = d.productId;
      byProduct[pid] ??= {
        reviewCount: 0,
        totalRating: 0,
        verifiedDelta: 0,
        starDelta: {},
        mediaDelta: { photos: 0, videos: 0, media: 0, reviewsWithMedia: 0 },
      };

      byProduct[pid].reviewCount -= 1;
      byProduct[pid].totalRating -= d.rating;
      if (getVerified(d)) byProduct[pid].verifiedDelta -= 1;
      byProduct[pid].starDelta[d.rating] =
        (byProduct[pid].starDelta[d.rating] || 0) - 1;

      const m = countMedia(d);
      byProduct[pid].mediaDelta.photos -= m.photos;
      byProduct[pid].mediaDelta.videos -= m.videos;
      byProduct[pid].mediaDelta.media -= m.media;
      byProduct[pid].mediaDelta.reviewsWithMedia -= m.rwMedia;
    }

    await Promise.all(
      Object.entries(byProduct).map(([pid, delta]) =>
        bumpStatsLegacy(pid, delta as any)
      )
    );

    res.json({ message: "Reviews deleted successfully" });
    return;
  } catch (error) {
    console.error("Error deleting reviews:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

/** ================================
 * BULK CREATE
 * ================================ */
const bulkCreate = async (req: Request, res: Response) => {
  const data = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    res.status(400).json({ message: "Invalid data format" });
    return;
  }
  try {
    const payload = data.map((d: any) => ({
      ...d,
      hasMedia: computeHasMedia(d),
    }));

    const createdDocs = await model.insertMany(payload);

    const byProduct: Record<string, any> = {};
    for (const d of createdDocs) {
      const key = d.productId;
      byProduct[key] ??= {
        reviewCount: 0,
        totalRating: 0,
        verifiedDelta: 0,
        starDelta: {} as any,
        mediaDelta: { photos: 0, videos: 0, media: 0, reviewsWithMedia: 0 },
      };
      byProduct[key].reviewCount += 1;
      byProduct[key].totalRating += d.rating;
      if (getVerified(d)) byProduct[key].verifiedDelta += 1;
      byProduct[key].starDelta[d.rating] =
        (byProduct[key].starDelta[d.rating] || 0) + 1;

      const m = countMedia(d);
      byProduct[key].mediaDelta.photos += m.photos;
      byProduct[key].mediaDelta.videos += m.videos;
      byProduct[key].mediaDelta.media += m.media;
      byProduct[key].mediaDelta.reviewsWithMedia += m.rwMedia;
    }
    await Promise.all(
      Object.entries(byProduct).map(([pid, delta]) =>
        bumpStatsLegacy(pid, delta as Delta)
      )
    );

    res.status(201).json(createdDocs);
  } catch (error) {
    console.error("Error importing documents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** ================================
 * CREATE CLIENT REVIEW (public)
 * ================================ */

export async function saveBase64Images(base64Array = [], uploadsDir: string) {
  const imageIds: string[] = [];

  for (const base64 of base64Array.slice(0, 5)) {
    try {
      const match = base64.match(/^data:image\/(\w+);base64,([\s\S]+)$/);
      if (!match) continue;
      const buffer = Buffer.from(match[2], "base64");
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.webp`;
      const filePath = path.join(uploadsDir, filename);

      await sharp(buffer)
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .toFormat("webp", { quality: 85 })
        .toFile(filePath);

      imageIds.push(filename);
    } catch (err) {
      console.error("Error saving image:", err);
    }
  }

  return imageIds; // chỉ trả về danh sách id
}

const uploadsDir = path.join(process.cwd(), "uploads");

const createClientReview = async (req, res) => {
  try {
    const {
      productId,
      title,
      rating,
      customer,
      email,
      body,
      imageUploads = [],
    } = req.body;

    const ids = await saveBase64Images(imageUploads, uploadsDir);

    const doc = await model.create({
      productId,
      title,
      rating,
      customer,
      email,
      body,
      imageUploads: ids,
      imageIds: ids, // chỉ lưu ID
      hasMedia: ids.length > 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await applyAddStats(doc);
    res.status(201).json(doc);
  } catch (err) {
    console.error("Create review failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** ================================
 * GET PRODUCT RATING
 * ================================ */
const getProductRating = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      res.status(400).json({ message: "productId is required" });
      return;
    }

    const stats = await ProductRating.findOne({ productId }).lean();

    if (!stats) {
      res.status(404).json({
        message: "Not Found",
      });
      return;
    }

    res.json({
      productId,
      avgRating: stats.avgRating,
      reviewCount: stats.reviewCount,
      starCounts: stats.starCounts,
      verifiedCount: stats.verifiedCount,
      photoCount: stats.photoCount, // NEW
      videoCount: stats.videoCount, // NEW
      mediaCount: stats.mediaCount, // NEW
      reviewsWithMedia: stats.reviewsWithMedia, // NEW
    });
  } catch (error) {
    console.error("Error fetching product rating:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** ================================
 * Stats helpers
 * ================================ */
type Star = 1 | 2 | 3 | 4 | 5;
type MediaDelta = {
  photos?: number;
  videos?: number;
  media?: number;
  reviewsWithMedia?: number;
};
type Delta = {
  reviewCount?: number;
  totalRating?: number;
  verifiedDelta?: number;
  starDelta?: Partial<Record<Star, number>>;
  mediaDelta?: MediaDelta; // NEW
};

const getVerified = (r: any) => !!(r?.isVerified || r?.purchaseVerified);

/**
 * Cập nhật thống kê theo kiểu "legacy" 2 lượt (hợp mọi phiên bản Mongo).
 * Lượt 1: $inc các biến đếm (+ upsert)
 * Lượt 2: đọc reviewCount/totalRating rồi set avgRating
 */
async function bumpStatsLegacy(productId: string, delta: Delta) {
  const inc: any = {
    reviewCount: delta.reviewCount || 0,
    totalRating: delta.totalRating || 0,
    verifiedCount: delta.verifiedDelta || 0,

    // ---- Media counters
    photoCount: delta.mediaDelta?.photos || 0,
    videoCount: delta.mediaDelta?.videos || 0,
    mediaCount: delta.mediaDelta?.media || 0,
    reviewsWithMedia: delta.mediaDelta?.reviewsWithMedia || 0,
  };

  for (let s = 1 as Star; s <= 5; s = (s + 1) as Star) {
    const v = delta.starDelta?.[s];
    if (v) inc[`starCounts.${s}`] = v;
  }

  await ProductRating.updateOne(
    { productId },
    {
      $inc: inc,
      $set: { lastReviewAt: new Date() },
      $setOnInsert: { avgRating: 0 },
    },
    { upsert: true }
  );

  const s = await ProductRating.findOne(
    { productId },
    { reviewCount: 1, totalRating: 1 }
  ).lean();

  if (s) {
    const avg =
      s.reviewCount > 0 ? +(s.totalRating / s.reviewCount).toFixed(2) : 0;
    await ProductRating.updateOne({ productId }, { $set: { avgRating: avg } });
  }
}

async function applyAddStats(doc: any) {
  const m = countMedia(doc);
  await bumpStatsLegacy(doc.productId, {
    reviewCount: 1,
    totalRating: doc.rating,
    verifiedDelta: getVerified(doc) ? 1 : 0,
    starDelta: { [doc.rating as Star]: 1 },
    mediaDelta: {
      photos: m.photos,
      videos: m.videos,
      media: m.media,
      reviewsWithMedia: m.rwMedia,
    },
  });
}

async function applyRemoveStats(doc: any) {
  const m = countMedia(doc);
  await bumpStatsLegacy(doc.productId, {
    reviewCount: -1,
    totalRating: -doc.rating,
    verifiedDelta: getVerified(doc) ? -1 : 0,
    starDelta: { [doc.rating as Star]: -1 },
    mediaDelta: {
      photos: -m.photos,
      videos: -m.videos,
      media: -m.media,
      reviewsWithMedia: -m.rwMedia,
    },
  });
}

/** Khi đổi rating/verified/media (và có thể đổi productId) */
async function applyUpdateStats(oldDoc: any, newDoc: any) {
  // Nếu đổi productId: trừ ở product cũ, cộng ở product mới
  if (oldDoc.productId !== newDoc.productId) {
    await applyRemoveStats(oldDoc);
    await applyAddStats(newDoc);
    return;
  }

  const delta: Delta = { starDelta: {}, mediaDelta: {} };

  // Rating đổi
  if (oldDoc.rating !== newDoc.rating) {
    delta.totalRating = newDoc.rating - oldDoc.rating;
    (delta.starDelta as any)[oldDoc.rating] = -1;
    (delta.starDelta as any)[newDoc.rating] = 1;
  }

  // Verified đổi
  const oldVer = getVerified(oldDoc);
  const newVer = getVerified(newDoc);
  if (oldVer !== newVer) delta.verifiedDelta = newVer ? 1 : -1;

  // Media đổi
  const om = countMedia(oldDoc);
  const nm = countMedia(newDoc);
  const photosDiff = nm.photos - om.photos;
  const videosDiff = nm.videos - om.videos;
  const mediaDiff = nm.media - om.media;
  const rwMediaDiff = nm.rwMedia - om.rwMedia;

  if (photosDiff || videosDiff || mediaDiff || rwMediaDiff) {
    delta.mediaDelta = {
      photos: photosDiff || 0,
      videos: videosDiff || 0,
      media: mediaDiff || 0,
      reviewsWithMedia: rwMediaDiff || 0,
    };
  }

  // Có thay đổi mới cập nhật
  if (
    delta.totalRating ||
    delta.verifiedDelta ||
    (delta.starDelta && Object.keys(delta.starDelta).length) ||
    (delta.mediaDelta &&
      (delta.mediaDelta.photos ||
        delta.mediaDelta.videos ||
        delta.mediaDelta.media ||
        delta.mediaDelta.reviewsWithMedia))
  ) {
    await bumpStatsLegacy(newDoc.productId, delta);
  }
}

const migrateHasMedia = async (_req: Request, res: Response) => {
  try {
    // Bước 1: Set hasMedia = true nếu có ít nhất 1 ảnh/video
    const updatedTrue = await model.updateMany(
      {
        $or: [
          { images: { $exists: true, $not: { $size: 0 } } },
          { videos: { $exists: true, $not: { $size: 0 } } },
          { imageUploads: { $exists: true, $not: { $size: 0 } } },
          { videoUploads: { $exists: true, $not: { $size: 0 } } },
        ],
      },
      { $set: { hasMedia: true } }
    );

    // Bước 2: Set hasMedia = false nếu KHÔNG có ảnh/video nào
    const updatedFalse = await model.updateMany(
      {
        $and: [
          {
            $or: [
              { images: { $exists: true } },
              { videos: { $exists: true } },
              { imageUploads: { $exists: true } },
              { videoUploads: { $exists: true } },
            ],
          },
          { images: { $size: 0 } },
          { videos: { $size: 0 } },
          { imageUploads: { $size: 0 } },
          { videoUploads: { $size: 0 } },
        ],
      },
      { $set: { hasMedia: false } }
    );

    res.json({
      message: "Migration completed",
      updatedTrue: updatedTrue.modifiedCount,
      updatedFalse: updatedFalse.modifiedCount,
    });
  } catch (error) {
    console.error("Error migrating hasMedia:", error);
    res.status(500).json({ message: "Migration error" });
  }
};

// PATCH /reviews/:id/helpful
const markHelpful = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  try {
    const doc = await model.findByIdAndUpdate(
      id,
      { $inc: { liked: 1 } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ liked: doc.liked });
  } catch (error) {
    console.error("Error marking helpful:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** ================================
 * EXPORT
 * ================================ */
export default {
  create,
  getAll,
  update,
  remove,
  findOne,
  deleteMany,
  bulkCreate,
  createClientReview,
  getProductRating,
  migrateHasMedia,
  markHelpful,
};
