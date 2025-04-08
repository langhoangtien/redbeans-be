import { Request, Response } from "express";
import model from "./geo-stat.model.js";
import mongoose from "mongoose";
import Order from "../order/order.model.js";

const trackVisit = async (req: Request, res: Response) => {
  const { country, city } = req.body;
  try {
    if (!country) {
      res.status(400).send("Country is required");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);

    await model.findOneAndUpdate(
      { date: today, country: country || "na", city: city || "Unknown" },
      { $inc: { count: 1 } },
      { upsert: true }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Error tracking visit:", error);
    res.status(500).send("Internal Server Error");
    return;
  }
};

const trackAddToCart = async (req: Request, res: Response) => {
  const { country, city } = req.body;
  try {
    if (!country) {
      res.status(400).send("Country is required");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);

    await model.findOneAndUpdate(
      { date: today, country: country || "na", city: city || "Unknown" },
      { $inc: { countAddToCart: 1 } },
      { upsert: true }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Error tracking add to cart:", error);
    res.status(500).send("Internal Server Error");
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
        { city: { $regex: search, $options: "i" } }, // Không phân biệt hoa thường
        { country: { $regex: search, $options: "i" } },
      ];
    }

    const [docs, totalDocs] = await Promise.all([
      model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),

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
    return;
  }
};

const getByDate = async (req: Request, res: Response) => {
  const fromRaw = req.query.from;
  const toRaw = req.query.to;
  const from = typeof fromRaw === "string" ? fromRaw : undefined;
  const to = typeof toRaw === "string" ? toRaw : undefined;
  const today = new Date();
  const defaultDateStr = today.toISOString().split("T")[0]; // 'YYYY-MM-DD'

  const startDateStr = from || defaultDateStr;
  const endDateStr = to || defaultDateStr;

  // Chuyển về kiểu Date cho Order (vì createdAt là Date)
  const orderStartDate = new Date(startDateStr);
  const orderEndDate = new Date(endDateStr);
  orderEndDate.setHours(23, 59, 59, 999);

  const geoMatchStage = {
    date: { $gte: startDateStr, $lte: endDateStr },
  };

  const orderMatchStage = {
    createdAt: { $gte: orderStartDate, $lte: orderEndDate },
  };

  try {
    const [summaryResult, topCountries, orderCount] = await Promise.all([
      // Thống kê GeoStat
      model.aggregate([
        { $match: geoMatchStage },
        {
          $group: {
            _id: null,
            totalCount: { $sum: "$count" },
            totalAddToCart: { $sum: "$countAddToCart" },
          },
        },
      ]),
      // Top 5 quốc gia
      model.aggregate([
        { $match: geoMatchStage },
        {
          $group: {
            _id: "$country",
            totalCount: { $sum: "$count" },
            totalAddToCart: { $sum: "$countAddToCart" },
          },
        },
        { $sort: { totalCount: -1 } },
        { $limit: 5 },
      ]),
      // Đếm số lượng đơn hàng trong khoảng thời gian
      Order.countDocuments(orderMatchStage),
    ]);

    if (summaryResult.length === 0) {
      res
        .status(404)
        .json({ message: "No data found for the given date range" });
      return;
    }

    const { totalCount, totalAddToCart } = summaryResult[0];

    res.json({
      startDate: startDateStr,
      endDate: endDateStr,
      totalCount,
      totalAddToCart,
      orderCount,
      topCountries: topCountries.map((c) => ({
        country: c._id,
        count: c.totalCount,
        countAddToCart: c.totalAddToCart,
      })),
    });
  } catch (error) {
    console.error(error);
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

export default {
  trackVisit,
  getAll,
  findOne,
  deleteMany,
  getByDate,
  trackAddToCart,
};
