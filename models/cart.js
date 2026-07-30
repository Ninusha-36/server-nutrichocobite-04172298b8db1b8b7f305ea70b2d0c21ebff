const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cartSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },

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
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Cart", cartSchema);
