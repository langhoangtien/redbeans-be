import { Request, Response } from "express";
import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
  PaymentsController,
  PurchaseUnitRequest,
} from "@paypal/paypal-server-sdk";
import { ObjectId } from "mongodb";
import { IProduct } from "../product/product.model";
import config from "@/config";
import Variant, { IVariant } from "../variant/variant.model";
import Order, { IOrderItem } from "../order/order.model";
import { Schema } from "mongoose";

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
interface IProductOrder {
  quantity: number;
  attributes: {
    name: string;
    value: string;
  }[];
  productId: any;
  variantId: any;
  price: number;
  name: string;
}
// interface IPurchaseUnitRequest {
//   amount: {
const ordersController = new OrdersController(client);
const paymentsController = new PaymentsController(client);
const createOrder = async (req: Request, res: Response): Promise<any> => {
  const cart: ICart = req.body;
  const cartClone = { ...cart };
  delete cartClone.voucher;
  let products: IOrderItem[] = [];
  let total = 0;
  try {
    // Duyệt qua từng sản phẩm trong giỏ hàng
    for (const item of cart.products) {
      // Tìm sản phẩm theo slug
      console.log("itemXXX", item);

      const product = await Variant.findById(item.id).populate<{
        productId: IProduct & { _id: ObjectId };
      }>("productId");
      console.log("productYYY", product);

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
        productId: product.productId._id,
        price: product.salePrice,
        name: product.productId.name, // Tránh lỗi Property 'name' does not exist
      };

      products.push(data);
      // Tính tổng tiền dựa trên giá của biến thể và số lượng
      total += (product.salePrice || 0) * item.quantity;
    }

    cartClone.amount = total.toFixed(2);
    const purchase: PurchaseUnitRequest = {
      amount: {
        currencyCode: "USD",
        value: total.toFixed(2),
        breakdown: {
          itemTotal: {
            currencyCode: "USD",
            value: total.toFixed(2),
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
      paypalOrderId: response.id, // ID từ PayPal
      userId: req.user?.id, // Nếu có user login
      products: products,
      total: total,
      email: cart.email,
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
    console.log("XXX", error);

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
    await Order.findOneAndUpdate(
      { paypalOrderId: id }, // Tìm đơn hàng theo PayPal ID
      { status: "COMPLETE" } // Đánh dấu là đã thanh toán
    );
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

export default {
  createOrder,
  captureOrder,
};
