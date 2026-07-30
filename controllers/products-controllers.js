const { validationResult } = require("express-validator");
const fs = require("fs");

const HttpError = require("../models/http-error");
const Product = require("../models/product");

const createProduct = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(422).json({
      status: "SS_03",
      message: "Invalid inputs passed, please check your data.",
    });
  }

  const {
    product_name,
    product_code,
    product_description,
    price_info,
    ingredients,
    self_life,
    user_id,
  } = req.body;

  let secondaryImages = [];
  if (req.files && req.files.secondary_images) {
    secondaryImages = req.files.secondary_images.map((file) => ({
      imageUrl: file.path,
    }));
  }

  let primaryImage = "";
  if (
    req.files &&
    req.files.primary_image &&
    req.files.primary_image.length > 0
  ) {
    primaryImage = req.files.primary_image[0].path;
  }

  let parsedPriceInfo;
  let parsedIngredients;

  try {
    parsedPriceInfo =
      typeof price_info === "string" ? JSON.parse(price_info) : price_info;
    parsedIngredients =
      typeof ingredients === "string"
        ? JSON.parse(ingredients)
        : ingredients;
  } catch (err) {
    return res.status(400).json({
      status: "SS_03",
      message: "Invalid JSON format for price info or ingredients.",
    });
  }

  const createdProduct = new Product({
    product_name,
    product_code,
    product_description,
    price_info: parsedPriceInfo,
    ingredients: parsedIngredients,
    self_life,
    primary_image: primaryImage,
    secondary_images: secondaryImages,
    user_id,
    approval_status: false,
  });

  try {
    await createdProduct.save();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "SS_03",
      message: "Creating product failed, please try again.",
    });
  }

  return res.status(201).json({
    status: "SS_02",
    message: "Product created successfully.",
    product: createdProduct.toObject({ getters: true }),
  });
};

// Get all products
const getProducts = async (req, res, next) => {
  let products;

  try {
    products = await Product.find();
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching products failed, please try again later.",
    });
  }

  return res.json({
    status: "SS_01",
    message: "Products fetched successfully.",
    products: products.map((product) => product.toObject({ getters: true })),
  });
};

const getDisplayProducts = async (req, res, next) => {
  const productId = req.params.pid;
  let products = [];

  let approvedProducts;
  let userPendingProduct;

  try {
    approvedProducts = await Product.find({ approval_status: true });
    if (productId) {
      userPendingProduct = await Product.findOne({
        _id: productId,
        approval_status: false,
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching products failed, please try again later.",
    });
  }

  products = [...(approvedProducts || [])];

  if (userPendingProduct) {
    products.push(userPendingProduct);
  }

  return res.json({
    status: "SS_01",
    message: "Display products fetched successfully.",
    products: products.map((product) => product.toObject({ getters: true })),
  });
};

// Get products by user ID
const getProductsByUser = async (req, res, next) => {
  const userId = req.params.uid;
  let filterProducts;

  try {
    filterProducts = await Product.find({ user_id: userId });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching products failed, please try again later.",
    });
  }

  return res.json({
    status: "SS_01",
    message: "User products fetched successfully.",
    products: filterProducts.map((product) =>
      product.toObject({ getters: true })
    ),
  });
};

const updateProduct = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(422).json({
      status: "SS_03",
      message: "Invalid inputs passed, please check your data.",
    });
  }

  const productId = req.params.pid;

  let {
    product_name,
    product_code,
    product_description,
    price_info,
    ingredients,
    self_life,
    user_id,
  } = req.body;

  let old_secondary_images = [];

  try {
    old_secondary_images = req.body.old_secondary_images
      ? JSON.parse(req.body.old_secondary_images)
      : [];
  } catch (err) {
    old_secondary_images = [];
  }

  try {
    price_info =
      typeof price_info === "string" ? JSON.parse(price_info) : price_info;

    ingredients =
      typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;
  } catch (err) {
    return res.status(400).json({
      status: "SS_03",
      message: "Invalid JSON format for price info or ingredients.",
    });
  }

  let product;

  try {
    product = await Product.findById(productId);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not find product.",
    });
  }

  if (!product) {
    return res.status(404).json({
      status: "SS_03",
      message: "Product not found.",
    });
  }

  // Store secondary images that should be deleted later
  const imagesToDelete = [];

  product.secondary_images.forEach((img) => {
    const exists = old_secondary_images.some(
      (item) => item._id?.toString() === img._id.toString()
    );

    if (!exists) {
      imagesToDelete.push(img.imageUrl);
    }
  });

  // Update text fields
  product.product_name = product_name;
  product.product_code = product_code;
  product.product_description = product_description;
  product.price_info = price_info;
  product.ingredients = ingredients;
  product.self_life = self_life;
  product.user_id = user_id;
  product.approval_status = false;

  // Replace primary image
  if (
    req.files &&
    req.files.primary_image &&
    req.files.primary_image.length > 0
  ) {
    const oldPrimaryImage = product.primary_image;

    product.primary_image = req.files.primary_image[0].path;

    if (oldPrimaryImage && fs.existsSync(oldPrimaryImage)) {
      fs.unlinkSync(oldPrimaryImage);
    }
  }

  // Existing secondary images
  let secondaryImages = [...old_secondary_images];

  // Newly uploaded secondary images
  if (
    req.files &&
    req.files.secondary_images &&
    req.files.secondary_images.length > 0
  ) {
    const newImages = req.files.secondary_images.map((file) => ({
      imageUrl: file.path,
    }));

    secondaryImages.push(...newImages);
  }

  product.secondary_images = secondaryImages;

  try {
    await product.save();
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Updating product failed.",
    });
  }

  // Delete removed secondary images after save
  imagesToDelete.forEach((imagePath) => {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  });

  return res.status(200).json({
    status: "SS_04",
    message: "Product updated successfully.",
    product: product.toObject({ getters: true }),
  });
};

const getProductById = async (req, res, next) => {
  const productId = req.params.pid;
  let product;

  try {
    product = await Product.findById(productId);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching product failed, please try again later.",
    });
  }

  if (!product) {
    return res.status(404).json({
      status: "SS_03",
      message: "Product not found with the provided ID.",
    });
  }

  return res.json({
    status: "SS_01",
    message: "Product fetched successfully.",
    product: product.toObject({ getters: true }),
  });
};

const deleteProduct = async (req, res, next) => {
  const productId = req.params.pid;

  let product;

  try {
    product = await Product.findById(productId);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not find product.",
    });
  }

  if (!product) {
    return res.status(404).json({
      status: "SS_03",
      message: "Product not found.",
    });
  }

  try {
    await Product.findByIdAndDelete(productId);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Deleting product failed.",
    });
  }

  return res.status(200).json({
    status: "SS_02",
    message: "Deleted product successfully.",
  });
};

const checkProductCode = async (req, res, next) => {
  const code = req.params.code;

  try {
    const product = await Product.findOne({ product_code: code });

    if (!product) {
      return res.json({
        status: "SS_01",
        message: "Product code available.",
        exists: null,
      });
    }

    return res.json({
      status: "SS_01",
      message: "Product code check completed.",
      exists: product.toObject({ getters: true }),
    });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Something went wrong while checking product code.",
    });
  }
};

exports.createProduct = createProduct;
exports.getProducts = getProducts;
exports.getDisplayProducts = getDisplayProducts;
exports.getProductsByUser = getProductsByUser;
exports.getProductById = getProductById;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.checkProductCode = checkProductCode;