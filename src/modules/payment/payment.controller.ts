import { Request, Response } from "express";
import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
  PaymentsController,
} from "@paypal/paypal-server-sdk";
import Product, { IProduct } from "../product/product.model";
import config from "@/config/config";

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
interface OrderResponse {
  jsonResponse: any;
  httpStatusCode: number;
}
interface ICart {
  products: {
    slug: string;
    quantity: number;
    attributes: Record<string, string>;
  }[];
  voucher?: string;
}
const ordersController = new OrdersController(client);
const paymentsController = new PaymentsController(client);
const createOrder = async (req: Request, res: Response): Promise<any> => {
  const cart: ICart = req.body;

  let total = 0;
  try {
    // Duyệt qua từng sản phẩm trong giỏ hàng
    for (const item of cart.products) {
      // Tìm sản phẩm theo slug
      const product: IProduct | null = await Product.findOne({
        slug: item.slug,
      }).lean();
      if (!product) {
        res.status(400).json({
          message: `Product with slug ${item.slug} not found`,
        });
        return;
      }

      // Tìm biến thể khớp dựa trên các thuộc tính
      const variant = product.variants.find((v) => {
        const vAttributes = v.attributes;
        const itemAttributes = item.attributes;

        // Kiểm tra số lượng key phải bằng nhau
        const keysMatch =
          Object.keys(vAttributes).length ===
          Object.keys(itemAttributes).length;
        if (!keysMatch) return false;

        // So sánh từng key-value
        return Object.keys(itemAttributes).every(
          (key) => vAttributes[key] === itemAttributes[key]
        );
      });

      if (!variant) {
        res.status(400).json({
          message: `Variant not found for product ${
            item.slug
          } with attributes ${JSON.stringify(item.attributes)}`,
        });
        return;
      }

      // Tính tổng tiền dựa trên giá của biến thể và số lượng
      total += variant.price * item.quantity;
    }

    // Xây dựng object yêu cầu cho PayPal
    const collect = {
      body: {
        intent: "CAPTURE" as CheckoutPaymentIntent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: "USD",
              // PayPal yêu cầu giá trị là chuỗi và định dạng thập phân có 2 chữ số
              value: total.toFixed(2),
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body } = await ordersController.ordersCreate(collect);

    const response = JSON.parse(body as string);
    if (!response.id) {
      res.status(500).json({ message: "Order ID not found in response" });
      return;
    }
    res.json(JSON.parse(body as string));
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
};
const createPayment = (req: Request, res: Response) => {
  const { amount, currency, source, description } = req.body;
  // const payment = await paymentService.createPayment({
  // amount,
  // currency,
  // source,
  // description,
  // });

  res.status(201).send("hg");
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
    res.json(response);
    console.log("REONSE", response);

    return;
    // return {
    //   jsonResponse: JSON.parse(body as string),
    //   httpStatusCode: httpResponse.statusCode,
    // };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
};

export default {
  createPayment,
  createOrder,
  captureOrder,
};
