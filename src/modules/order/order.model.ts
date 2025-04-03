import { Document, Model, model, Schema } from "mongoose";

// --- Định nghĩa các hằng số enum cho trạng thái đơn hàng và phương thức thanh toán ---
export const OrderStatus = {
  PENDING: "PENDING",
  COMPLETE: "COMPLETE",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  PAID: "PAID",
  SHIPPED: "SHIPPED",
} as const;
export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  PAYPAL: "paypal",
  CREDIT_CARD: "card",
  BANK_TRANSFER: "bank_transfer",
  CASH_ON_DELIVERY: "cash_on_delivery",
  NA: "n/a",
} as const;
export type PaymentMethodType =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const paymentGateway = {
  PAYPAL: "paypal",
  STRIPE: "stripe",
} as const;
export type paymentGatewayType =
  (typeof paymentGateway)[keyof typeof paymentGateway];

// --- Interface cho từng Order Item ---
export interface IOrderItem {
  quantity: number;
  name: string;
  image?: string; // Hình ảnh của sản phẩm
  variantId: string; // Tham chiếu trực tiếp đến Variant
  price: number; // Giá của sản phẩm tại thời điểm đặt hàng
  productId: string; // Tham chiếu trực tiếp đến Product
  attributes?: {
    name: string;
    value: string;
  }[]; // Các thuộc tính của sản phẩm
}

// --- Interface cho Order ---
export interface IOrder extends Document {
  products: IOrderItem[];
  voucher?: string | null;
  total?: string; // Tổng tiền của đơn hàng
  user?: Schema.Types.ObjectId; // Tham chiếu đến người dùng (nếu có)
  status: OrderStatusType;
  paymentMethod: PaymentMethodType;
  paymentId?: string; // ID của đơn hàng trên PayPal
  trackingNumber?: string; // Mã vận đơn
  logisticPartner?: string; // Đơn vị vận chuyển
  isSendEmail?: boolean; // Đã gửi email thông báo cho khách hàng
  email?: string;
  name?: string;
  paymentSource?: object; // Nguồn thanh toán (nếu có)
  paypalStatus?: string; // Trạng thái đơn hàng trên PayPal
  shippingAddress?: IShippingDetails;
  deliveryAddress?: IShippingDetails;
  paymentGateway?: paymentGatewayType; // Cổng thanh toán (nếu có)
  tax?: string; // Thuế áp dụng cho đơn hàng
  createdAt: Date;
  updatedAt: Date;
}

export interface IShippingDetails {
  name: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
const AttributesSchmea = new Schema({
  name: {
    type: String,
  },
  value: {
    type: String,
  },
});
// --- Schema cho từng Order Item ---
const orderItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  variantId: {
    type: Schema.Types.ObjectId,
    ref: "Variant",
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  image: {
    type: String,
  },

  quantity: {
    type: Number,
    required: true,
    max: 1000,
  },

  price: {
    type: Number,
    required: true,
  },
  attributes: [AttributesSchmea],
});

const ShippingDetailsSchema = new Schema({
  fullName: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  address2: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  postalCode: {
    type: String,
  },
  country: {
    type: String,
  },
});
// --- Schema cho Order ---
const orderSchema = new Schema(
  {
    products: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (v: any[]) {
          return v.length > 0;
        },
        message: "Order must contain at least one product",
      },
    },
    email: {
      type: String,
      required: true,
      maxLength: 100,
    },
    name: {
      type: String,
      maxLength: 200,
    },
    voucher: {
      type: String,
      default: null,
      maxLength: 200,
    },
    total: {
      type: String,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    paymentGateway: {
      type: String,
      default: "paypal",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    paypalOrderId: {
      type: String,
      default: null,
    },
    paymentSource: {
      type: Object,
    },
    paypalStatus: {
      type: String,
    },
    paymentId: {
      type: String,
      default: null,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
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
    trackingNumber: {
      type: String,
    },
    logisticPartner: {
      type: String,
    },
    isSendEmail: {
      type: Boolean,
      default: false,
    },

    shippingAddress: {
      type: ShippingDetailsSchema,
    },
    billingAddress: {
      type: ShippingDetailsSchema,
    },
  },
  { timestamps: true, versionKey: false }
);

const Order: Model<IOrder> = model<IOrder>("Order", orderSchema);
export default Order;
