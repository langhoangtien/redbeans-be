import { Request, Response } from "express";
import { getSettings } from "../settings/settings.controller.js";

const MAX_DAYS = 30; // Maximum days to look back for orders
const findOne = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orderNumber, email } = req.body;

  const settings = await getSettings();
  const token = settings.tokens.find((t) => t.domain === id);
  if (!token) {
    res.status(404).json({
      message: "Shop not found",
    });
    return;
  }

  const formattedOrderName = orderNumber.startsWith("#")
    ? orderNumber
    : `#${orderNumber}`;

  const url = `https://${token.domain}/admin/api/${
    token.version
  }/orders.json?name=${encodeURIComponent(formattedOrderName)}&status=any`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token.accessToken,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    const order = data.orders?.[0];

    if (!order) {
      res.status(404).json({
        error: "Order not found or information does not match",
      });
      return;
    }

    const createdAt = new Date(order.created_at);
    const now = new Date();
    const daysAgo =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo > MAX_DAYS) {
      res.status(404).json({
        error: `Order not found or older than ${MAX_DAYS} days`,
      });
      return;
    }
    if (!email) {
      console.log("Email not provided, skipping email check");
    }
    // if (!order.email || order.email.toLowerCase() !== email.toLowerCase()) {
    //   res.status(403).json({
    //     error: "Order not found or information does not match",
    //   });
    //   return;
    // }

    const fulfillment = order.fulfillments?.[0];

    if (!fulfillment || !fulfillment.tracking_url) {
      res.status(200).json({
        message: "Order has no tracking info yet",
      });
      return;
    }

    res.status(200).json({
      order_name: order.name,
      tracking_url: fulfillment.tracking_url,
      tracking_number: fulfillment.tracking_number || "Unknown",
      carrier: fulfillment.tracking_company || "Unknown",
      status: order.fulfillment_status || "Unfulfilled",
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      message: "Server error",
    });
    return;
  }
};

export default {
  findOne,
};
