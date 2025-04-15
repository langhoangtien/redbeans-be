import { ObjectId } from "mongoose";
import Order, {
  IOrderItem,
  OrderStatus,
  PaymentMethod,
} from "../order/order.model.js"; // Adjust the import path as necessary
import { IProduct } from "../product/product.model.js";
import Variant from "../variant/variant.model.js";

import { calculateTax } from "../../utilities/index.js";

import { ICart } from "./payment.validate.js";

import { Request, Response } from "express";

async function codPayment(req: Request, res: Response) {
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
        title: product.title,
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

    const newOrder = new Order({
      products: products,
      total: total,
      tax: tax.toFixed(2),
      email: cart.email,
      name: cart.shippingAddress.fullName,
      billingAddress: cart.billingAddress,
      shippingAddress: cart.shippingAddress,
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      status: OrderStatus.PENDING,
    });

    await newOrder.save();

    res.status(201).json(newOrder);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
}

export default {
  codPayment,
};
