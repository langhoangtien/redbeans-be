import { model, Schema } from "mongoose";
// --- Định nghĩa các hằng số enum cho trạng thái đơn hàng và phương thức thanh toán ---
export const OrderStatus = {
    PENDING: "PENDING",
    PAID: "COMPLETE",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
};
export const PaymentMethod = {
    PAYPAL: "paypal",
    CREDIT_CARD: "credit_card",
    BANK_TRANSFER: "bank_transfer",
    CASH_ON_DELIVERY: "cash_on_delivery",
    STRIPE: "stripe",
};
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
const orderSchema = new Schema({
    products: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function (v) {
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
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    paypalOrderId: {
        type: String,
        default: null,
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
}, { timestamps: true, versionKey: false });
const Order = model("Order", orderSchema);
export default Order;
//# sourceMappingURL=order.model.js.map