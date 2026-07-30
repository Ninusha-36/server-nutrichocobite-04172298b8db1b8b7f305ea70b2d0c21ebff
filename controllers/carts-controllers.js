const { validationResult } = require("express-validator");
const Cart = require("../models/cart");

const createMultipleCart = async (req, res, next) => {
  const { cart_items } = req.body;

  if (!Array.isArray(cart_items) || cart_items.length === 0) {
    return res.status(422).json({
      status: "SS_03",
      message: "Cart items are required.",
    });
  }

  try {
    const bulkOps = cart_items.map((item) => ({
      updateOne: {
        filter: {
          user_id: item.user_id,
          product_id: item.product_id,
          size: item.size,
        },
        update: {
          $inc: { quantity: Number(item.quantity) },
          $setOnInsert: { price: item.price },
        },
        upsert: true,
      },
    }));

    await Cart.bulkWrite(bulkOps);

    return res.status(201).json({
      status: "SS_02",
      message: "Cart items processed successfully.",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "SS_03",
      message: "Failed to process cart items, please try again.",
    });
  }
};

const createCart = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: "SS_03",
      message: "Invalid inputs passed, please check your data.",
    });
  }

  const { user_id, product_id, size, quantity, price } = req.body;

  let cart;

  try {
    cart = await Cart.findOne({
      user_id: user_id,
      product_id: product_id,
      size: size,
    });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not query cart data, please try again later.",
    });
  }

  if (!cart) {
    const createdCart = new Cart({
      user_id,
      product_id,
      size,
      quantity: Number(quantity),
      price,
    });

    try {
      await createdCart.save();
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        status: "SS_03",
        message: "Adding product to cart failed, please try again.",
      });
    }

    return res.status(201).json({
      status: "SS_02",
      message: "Item added to cart successfully.",
      cart: createdCart.toObject({ getters: true }),
    });
  }

  cart.quantity += Number(quantity);

  try {
    await cart.save();
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not update cart quantity, please try again.",
    });
  }

  return res.status(200).json({
    status: "SS_04",
    message: "Cart item updated successfully.",
    cart: cart.toObject({ getters: true }),
  });
};

const updateQuantity = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: "SS_03",
      message: "Invalid inputs passed, please check your data.",
    });
  }

  const { user_id, product_id, size, quantity } = req.body;

  let cart;

  try {
    cart = await Cart.findOne({
      user_id: user_id,
      product_id: product_id,
      size: size,
    });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching cart item failed.",
    });
  }

  if (!cart) {
    return res.status(404).json({
      status: "SS_03",
      message: "Could not find cart item to update.",
    });
  }

  cart.quantity = Number(quantity);

  try {
    await cart.save();
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not update cart quantity.",
    });
  }

  return res.status(200).json({
    status: "SS_04",
    message: "Cart quantity updated successfully.",
    cart: cart.toObject({ getters: true }),
  });
};

const getCarts = async (req, res, next) => {
  const userId = req.params.uid;
  let carts;

  try {
    carts = await Cart.find({ user_id: userId });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching cart items failed, please try again later.",
    });
  }

  return res.json({
    status: "SS_01",
    message: "Cart items fetched successfully.",
    carts: carts.map((cart) => cart.toObject({ getters: true })),
  });
};

const deleteCart = async (req, res, next) => {
  const cartId = req.params.cid;

  let cart;

  try {
    cart = await Cart.findById(cartId);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not find cart item.",
    });
  }

  if (!cart) {
    return res.status(404).json({
      status: "SS_03",
      message: "Cart item not found.",
    });
  }

  try {
    await Cart.findByIdAndDelete(cartId);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Deleting cart item failed.",
    });
  }

  return res.status(200).json({
    status: "SS_02",
    message: "Cart item removed successfully.",
  });
};

exports.createMultipleCart = createMultipleCart;
exports.createCart = createCart;
exports.getCarts = getCarts;
exports.updateQuantity = updateQuantity;
exports.deleteCart = deleteCart;