import ProductRating from "../product/product-rating.model.js";

export type Star = 1 | 2 | 3 | 4 | 5;
export type Delta = {
  reviewCount?: number;
  totalRating?: number;
  verifiedDelta?: number;
  starDelta?: Partial<Record<Star, number>>;
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
  await bumpStatsLegacy(doc.productId, {
    reviewCount: 1,
    totalRating: doc.rating,
    verifiedDelta: getVerified(doc) ? 1 : 0,
    starDelta: { [doc.rating as Star]: 1 },
  });
}

async function applyRemoveStats(doc: any) {
  await bumpStatsLegacy(doc.productId, {
    reviewCount: -1,
    totalRating: -doc.rating,
    verifiedDelta: getVerified(doc) ? -1 : 0,
    starDelta: { [doc.rating as Star]: -1 },
  });
}

/** Khi đổi rating/verified (và có thể đổi productId) */
async function applyUpdateStats(oldDoc: any, newDoc: any) {
  // Nếu đổi productId: trừ ở product cũ, cộng ở product mới
  if (oldDoc.productId !== newDoc.productId) {
    await applyRemoveStats(oldDoc);
    await applyAddStats(newDoc);
    return;
  }

  const delta: Delta = { starDelta: {} };
  if (oldDoc.rating !== newDoc.rating) {
    delta.totalRating = newDoc.rating - oldDoc.rating;
    (delta.starDelta as any)[oldDoc.rating] = -1;
    (delta.starDelta as any)[newDoc.rating] = 1;
  }

  const oldVer = getVerified(oldDoc);
  const newVer = getVerified(newDoc);
  if (oldVer !== newVer) delta.verifiedDelta = newVer ? 1 : -1;

  // Có thay đổi mới cập nhật
  if (
    delta.totalRating ||
    delta.verifiedDelta ||
    (delta.starDelta && Object.keys(delta.starDelta).length)
  ) {
    await bumpStatsLegacy(newDoc.productId, delta);
  }
}

export {
  bumpStatsLegacy,
  getVerified,
  applyAddStats,
  applyUpdateStats,
  applyRemoveStats,
};
