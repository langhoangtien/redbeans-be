import { Request, Response } from "express";
import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
  PurchaseUnitRequest,
} from "@paypal/paypal-server-sdk";
import { ObjectId } from "mongodb";
import { IProduct } from "../product/product.model.js";
import config from "../../config/index.js";
import Variant from "../variant/variant.model.js";
import Order, { IOrder, IOrderItem } from "../order/order.model.js";

import { calculateTax } from "../../utilities/index.js";

import { sendEmail } from "../../utilities/sendmail.js";

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: config.paypalClientId,
    oAuthClientSecret: config.paypalClientSecret,
  },
  timeout: 0,
  environment: Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true },
  },
});

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

// interface IPurchaseUnitRequest {
//   amount: {
const ordersController = new OrdersController(client);

const createOrder = async (req: Request, res: Response): Promise<any> => {
  console.log("CREATE_ORDER");

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
    const total = (
      totalWithoutTax *
      (1 +
        calculateTax(
          cart.shippingAddress.country,
          cart.shippingAddress.state || ""
        ))
    ).toFixed(2);

    console.log("TOTAL", total, "TOTAL_WITHOUT_TAX", totalWithoutTax);

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
      // items: products.map((item) => {
      //   return {
      //     name: item.name,
      //     quantity: item.quantity.toString(),
      //     unitAmount: {
      //       currencyCode: "USD",
      //       value: item.price.toFixed(2),
      //     },
      //   };
      // }),
      // shipping: {
      //   name: {
      //     fullName: cart.shippingAddress.fullName,
      //   },
      //   address: {
      //     addressLine1: cart.shippingAddress.address,
      //     addressLine2: cart.shippingAddress.address2,
      //     adminArea2: cart.shippingAddress.city,
      //     adminArea1: cart.shippingAddress.state,
      //     postalCode: cart.shippingAddress.postalCode,
      //     countryCode: cart.shippingAddress.country,
      //   },
      // },
    };
    // Xây dựng object yêu cầu cho PayPal
    const collect = {
      body: {
        intent: "CAPTURE" as CheckoutPaymentIntent,
        purchaseUnits: [purchase],
      },
      prefer: "return=minimal",
    };

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
      email: cart.email,
      name: cart.shippingAddress.fullName,
      billingAddress: cart.billingAddress,
      shippingAddress: cart.shippingAddress,
      paymentMethod: "paypal",
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
    const { body } = await ordersController.ordersCapture(collect);
    const response = JSON.parse(body as string);
    if (response.status !== "COMPLETED") {
      res.status(400).json({ message: "Order not completed" });
      return;
    }
    const order = await Order.findOneAndUpdate(
      { paymentId: id }, // Tìm đơn hàng theo PayPal ID
      { status: "COMPLETE" },
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
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>$${item.price.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  // Render địa chỉ giao hàng
  const shippingAddress = order.shippingAddress
    ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country}`
    : "N/A";

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
          <a class="button" href="#">Track My Order</a>

          <p>If you have any questions, feel free to contact us at <a href="mailto:contact@quitmood.net">contact@quitmood.net</a>.</p>

          <div class="footer">
              <p>Best regards,<br><strong>Quit Mood Team</strong></p>
          </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: order.email,
    subject: "Order Confirmation - QuitMood",
    text: `Thank you for your order! Your order ID is ${order._id || "N/A"}.`,
    html: htmlTemplate,
  });
  // Gửi email
  // await transporter.sendMail({
  //   from: '"LUDMIA" <your-email@yourdomain.com>',
  //   to: order.email,
  //   subject: "Your Order Confirmation - LUDMIA",
  //   html: htmlTemplate,
  // });

  // console.log(`✅ Order confirmation email sent to ${order.email}`);
};

export default {
  createOrder,
  captureOrder,
};
