const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    products: [
      {
        product_id: {
          type: String,
          required: true,
        },


        size: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        total: {
          type: Number,
          required: true,
        },
      },
    ],

    address_id: {
      type: String,
      required: true,
    },

    payment_method: {
      type: String,
      required: true,
    },

    payment_status: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    order_status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    subtotal: {
      type: Number,
      required: true,
    },

    delivery_charge: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    grand_total: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);