import { Document, Model, model, Schema } from "mongoose";

// --- Định nghĩa các hằng số enum cho trạng thái đơn hàng và phương thức thanh toán ---
export const OrderStatus = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPED: "shipped",
  CANCELLED: "cancelled",
} as const;
export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  PAYPAL: "paypal",
  CREDIT_CARD: "credit_card",
  BANK_TRANSFER: "bank_transfer",
  CASH_ON_DELIVERY: "cash_on_delivery",
} as const;
export type PaymentMethodType =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

// --- Interface cho từng Order Item ---
export interface IOrderItem {
  productId: Schema.Types.ObjectId; // Tham chiếu trực tiếp đến Product
  quantity: number;
  attributes: Record<string, string>;
  price: number; // Giá của sản phẩm tại thời điểm đặt hàng
}

// --- Interface cho Order ---
export interface IOrder extends Document {
  products: IOrderItem[];
  voucher?: string | null;
  total: number; // Tổng tiền của đơn hàng
  user?: Schema.Types.ObjectId; // Tham chiếu đến người dùng (nếu có)
  status: OrderStatusType;
  paymentMethod: PaymentMethodType;
  createdAt: Date;
  updatedAt: Date;
}

// --- Schema cho từng Order Item ---
const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product", // Tham chiếu đến Product model
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      max: 1000,
    },
    attributes: {
      type: Map,
      of: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// --- Schema cho Order ---
const orderSchema = new Schema<IOrder>(
  {
    products: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (v: IOrderItem[]) {
          return v.length > 0;
        },
        message: "Order must contain at least one product",
      },
    },
    voucher: {
      type: String,
      default: null,
      maxLength: 200,
    },
    total: {
      type: Number,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const Order: Model<IOrder> = model<IOrder>("Order", orderSchema);
export default Order;
