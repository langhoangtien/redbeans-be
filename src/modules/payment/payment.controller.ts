import { Request, Response } from "express";
import {
  ApiError,
  CheckoutPaymentIntent,
  PurchaseUnitRequest,
} from "@paypal/paypal-server-sdk";
import axios from "axios";
import { ObjectId } from "mongodb";
import { IProduct } from "../product/product.model.js";
import Variant from "../variant/variant.model.js";
import Order, { IOrder, IOrderItem } from "../order/order.model.js";

import { calculateTax } from "../../utilities/index.js";
import { sendEmail } from "../email/email.controller.js";
import { getSettings } from "../settings/settings.controller.js";
import getOrdersController from "./payment-order.controller.js";

interface ICart {
  products: {
    quantity: number;
    id: string;
  }[];
  voucher?: string;
  amount: string;
  email: string;
  shippingAddress: {
    fullName: string;
    address: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phoneNumber: {
      countryCode: string;
      nationalNumber: string;
    };
  };
  billingAddress: {
    fullName: string;
    phone: string;
    address: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

async function getAccessToken() {
  const settings = await getSettings();
  try {
    const url =
      settings.paypalMode === "Production"
        ? "https://api.paypal.com"
        : "https://api.sandbox.paypal.com";

    const response = await axios.post(
      `${url}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: {
          username: settings.paypalClientId,
          password: settings.paypalSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      paypalUrl: url,
      paypalClientId: settings.paypalClientId,
    };
  } catch (error) {
    return null;
  }
}

type GetAccessTokenResponse = {
  accessToken: string;
  paypalUrl: string;
  paypalClientId: string;
} | null;
async function generateClientData(_req: Request, res: Response) {
  console.log("Generating client token...");
  try {
    // 1️⃣ Lấy access token từ PayPal

    const data: GetAccessTokenResponse = await getAccessToken();
    if (!data) {
      res.status(500).json({ error: "Error generating access token" });
      return;
    }

    // 2️⃣ Lấy client token
    const tokenResponse = await axios({
      url: `${data.paypalUrl}/v1/identity/generate-token`,
      method: "post",
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
        "Content-Type": "application/json",
      },
      data: {},
    });

    res.json({
      data: {
        clientToken: tokenResponse.data.client_token,
        paypalClientId: data.paypalClientId,
      },
    });
  } catch (error) {
    console.error("Error generating client token:", error);
    res.status(500).json({ error: "Error generating client token" });
    return;
  }
}
const createOrder = async (req: Request, res: Response): Promise<any> => {
  console.log("Creating order...");

  const cart: ICart = req.body;
  const cartClone = { ...cart };
  delete cartClone.voucher;
  let products: IOrderItem[] = [];
  let totalWithoutTax = 0;
  try {
    // Duyệt qua từng sản phẩm trong giỏ hàng
    for (const item of cart.products) {
      // Tìm sản phẩm theo slug

      const product = await Variant.findById(item.id).populate<{
        productId: IProduct & { _id: ObjectId };
      }>("productId");

      if (!product) {
        res
          .status(400)
          .json({ message: `Product not found for variant ${item.id}` });

        return;
      }

      const data = {
        quantity: item.quantity,
        attributes: product.attributes,
        variantId: item.id,
        productId: product.productId._id.toString(),
        price: product.price,
        name: product.productId.name, // Tránh lỗi Property 'name' does not exist
      };

      products.push(data);
      // Tính tổng tiền dựa trên giá của biến thể và số lượng
      totalWithoutTax += (product.price || 0) * item.quantity;
    }
    const taxPercent = calculateTax(
      cart.shippingAddress.country,
      cart.shippingAddress.state || ""
    );
    const tax = totalWithoutTax * taxPercent;
    const total = (totalWithoutTax + tax).toFixed(2);

    cartClone.amount = total;
    const purchase: PurchaseUnitRequest = {
      amount: {
        currencyCode: "USD",
        value: total,
        breakdown: {
          itemTotal: {
            currencyCode: "USD",
            value: total,
          },
        },
      },
    };
    // Xây dựng object yêu cầu cho PayPal
    const collect = {
      body: {
        intent: "CAPTURE" as CheckoutPaymentIntent,
        purchaseUnits: [purchase],
      },
      prefer: "return=minimal",
    };

    const settings = await getSettings();

    if (
      !settings?.paypalClientId ||
      !settings?.paypalSecret ||
      !settings?.paypalMode
    ) {
      return null;
    }

    const ordersController = await getOrdersController();
    if (!ordersController) {
      res.status(500).json({ message: "Failed to create PayPal client" });
      return;
    }
    const { body } = await ordersController.ordersCreate(collect);

    const response = JSON.parse(body as string);
    if (!response.id) {
      res.status(500).json({ message: "Order ID not found in response" });
      return;
    }
    const newOrder = new Order({
      paymentId: response.id, // ID từ PayPal
      userId: req.user?.id, // Nếu có user login
      products: products,
      total: total,
      tax: tax.toFixed(2),
      email: cart.email,
      name: cart.shippingAddress.fullName,
      billingAddress: cart.billingAddress,
      shippingAddress: cart.shippingAddress,
      paypalStatus: response.status,
      paymentGateway: "paypal",
      paymentMethod: "n/a",
      status: "PENDING", // Ban đầu đơn hàng sẽ ở trạng thái chờ thanh toán
    });

    await newOrder.save();
    res.json(JSON.parse(body as string));
    return;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(500).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

const captureOrder = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const collect = {
    id,
    prefer: "return=minimal",
  };

  try {
    const ordersController = await getOrdersController();
    if (!ordersController) {
      res.status(500).json({ message: "Failed to create PayPal client" });
      return;
    }
    const { body } = await ordersController.ordersCapture(collect);
    const response = JSON.parse(body as string);

    if (response.status !== "COMPLETED") {
      res.status(400).json({ message: "Order not completed" });
      return;
    }

    let paymentMethod = "n/a";
    if (response.payment_source?.paypal) {
      paymentMethod = "paypal";
    }
    if (response.payment_source?.card) {
      paymentMethod = "card";
    }
    const order = await Order.findOneAndUpdate(
      { paymentId: id }, // Tìm đơn hàng theo PayPal ID
      {
        status: "PAID",
        paymentSource: response.payment_source,
        paypalStatus: response.status,
        paymentMethod: paymentMethod,
      }, // Cập nhật trạng thái đơn hàng
      { new: true } // Trả về document đã cập nhật
    );

    if (!order) {
      console.error("Order not found!");
      return;
    }
    sendOrderConfirmationEmail(order);
    res.json(response);
    return;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

const sendOrderConfirmationEmail = async (order: IOrder) => {
  // Tạo danh sách sản phẩm từ `order.products`
  const productRows = order.products
    .map(
      (item) => `
      <tr>
        <td><p>${item.name}</p>
           <p class="product-attr">${item.attributes
             .map((attr) => `<span>${attr.name}: ${attr.value}</span>`)
             .join(", ")}</p>
        </p>
        </td>
        <td><p>${item.quantity}</p>
     
        
        </td>
        <td>$${item.price.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  // Render địa chỉ giao hàng
  const shippingAddress = order.shippingAddress
    ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country}`
    : "N/A";

  const settings = await getSettings();
  // Xây dựng nội dung email
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <title>Order Confirmation - LUDMIA</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h2 {
            color: #333;
        }
        .order-details {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
        th {
            background: #007bff;
            color: #ffffff;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin-top: 20px;
            background: #007bff;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
       .product-attr {
            font-size: 12px;
            color: #666;
  }
    </style>
    </head>
    <body>
      <div class="container">
          <h2>Thank You for Your Order, ${order.name}!</h2>
          <p>Your order <strong>#${
            order._id || "N/A"
          }</strong> has been successfully placed.</p>

          <div class="order-details">
              <p><strong>Order Status:</strong> ${order.status}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              
              <p><strong>Order Summary:</strong></p>
              <table>
                  <thead>
                      <tr><th>Product</th><th>Quantity</th><th>Price</th></tr>
                  </thead>
                  <tbody>
                      ${productRows}
                  </tbody>
              </table>
              <p><strong>Tax: </strong>$${order.tax}</p>
              <p><strong>Total: </strong>$${order.total}</p>
              <p><strong>Voucher Applied: </strong>${
                order.voucher || "None"
              }</p>
              <p><strong>Shipping Address: </strong>${shippingAddress}</p>
              <p><strong>Estimated Delivery: </strong>${
                order.deliveryAddress?.city || "N/A"
              }</p>
          </div>

          <p>You can track your order status by clicking the button below:</p>
          <a class="button" href="${
            settings.companWebsite
          }/track-order">Track My Order</a>

          <p>If you have any questions, feel free to contact us at <a href="mailto:${
            settings.smtpUser
          }">${settings.smtpUser}</a>.</p>

          <div class="footer">
              <p>Best regards,<br><strong>${
                settings.companyName
              } Team</strong></p>
          </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: order.email,
    subject: `Order Confirmation - ${settings.companyName}`,
    text: `Thank you for your order! Your order ID is ${order._id || "N/A"}.`,
    html: htmlTemplate,
  });
};

export default {
  createOrder,
  captureOrder,
  generateClientData,
};
