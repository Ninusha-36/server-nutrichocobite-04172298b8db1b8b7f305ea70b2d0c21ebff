const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  product_name: {
    type: String,
    required: true,
  },

  product_code: {
    type: String,
    required: true,
  },

  product_description: {
    type: String,
    required: true,
  },

  price_info: [
    {
      size: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      available_qty: {
        type: Number,        
      },
    },
  ],

  primary_image: {
    type: String,
    required: true,
  },

  secondary_images: [
    {
      imageUrl: String,
    },
  ],

  ingredients: [
    {
      type: String,
    },
  ],


  self_life: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  approval_status: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model("Product", productSchema);
