import mongoose, { mongo } from "mongoose";
import { Request, Response } from "express";

import ProductRating from "../product/product-rating.model.js";
import model from "./review.model.js"; // Adjust the import path as necessary

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
    const sortBy = (req.query.sortBy as string) || "createdAt";
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

    const [docs, totalDocs] = await Promise.all([
      model
        .find(filter)
        .sort({ hasMedia: -1, [sortBy]: sortOrder, _id: 1 }) // ưu tiên review có media
        .skip(skip)
        .limit(limit),
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

    await applyRemoveStats(deletedDoc);
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Server error" });
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
    // lấy trước để tính delta
    const docs = await model.find({ _id: { $in: ids } }).lean();

    const deleted = await model.deleteMany({ _id: { $in: ids } });
    if (deleted.deletedCount === 0) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    // gộp delta theo productId để giảm số lần update
    const byProduct: Record<string, any> = {};
    for (const d of docs) {
      const key = d.productId;
      byProduct[key] ??= {
        reviewCount: 0,
        totalRating: 0,
        verifiedDelta: 0,
        starDelta: {} as any,
        mediaDelta: { photos: 0, videos: 0, media: 0, reviewsWithMedia: 0 },
      };
      byProduct[key].reviewCount -= 1;
      byProduct[key].totalRating -= d.rating;
      if (getVerified(d)) byProduct[key].verifiedDelta -= 1;
      byProduct[key].starDelta[d.rating] =
        (byProduct[key].starDelta[d.rating] || 0) - 1;

      const m = countMedia(d);
      byProduct[key].mediaDelta.photos -= m.photos;
      byProduct[key].mediaDelta.videos -= m.videos;
      byProduct[key].mediaDelta.media -= m.media;
      byProduct[key].mediaDelta.reviewsWithMedia -= m.rwMedia;
    }
    await Promise.all(
      Object.entries(byProduct).map(([pid, delta]) =>
        bumpStatsLegacy(pid, delta as Delta)
      )
    );

    res.json({ message: "Documents deleted successfully" });
  } catch (error) {
    console.error("Error deleting documents:", error);
    res.status(500).json({ message: "Server error" });
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
const createClientReview = async (req: Request, res: Response) => {
  try {
    const { productId, title, rating, customer, email, body } = req.body;
    const createdAt = new Date();
    const updatedAt = new Date();
    const data = {
      productId,
      title,
      rating,
      customer,
      createdAt,
      updatedAt,
      body,
      email,
      hasMedia: computeHasMedia(req.body),
    };

    const newModel = new model(data);
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
};
