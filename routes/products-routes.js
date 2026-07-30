const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("./../middleware/file-upload");
const CheckAuth = require("../middleware/check-auth");

const productsControllers = require("../controllers/products-controllers");

const router = express.Router();

router.get("/display_product/:uid", productsControllers.getDisplayProducts);

router.get("/check-code/:code", productsControllers.checkProductCode);
router.get("/product/:pid", productsControllers.getProductById);

router.use(CheckAuth);

router.post(
  "/create-product",
  fileUpload.fields([
    { name: "primary_image", maxCount: 1 },
    { name: "secondary_images", maxCount: 10 },
  ]),
  [
    check("product_name").not().isEmpty(),
    check("product_code").not().isEmpty(),
    check("product_description").isLength({ min: 5 }),
    check("self_life").not().isEmpty(),
  ],
  productsControllers.createProduct,
);

// Get all users
router.get("/", productsControllers.getProducts);
router.get("/user/:uid", productsControllers.getProductsByUser);



router.post( 
  "/product/:pid",
  fileUpload.fields([
    { name: "primary_image", maxCount: 1 },
    { name: "secondary_images", maxCount: 10 },
  ]),
  [
    check("product_name").not().isEmpty(),
    check("product_code").not().isEmpty(),
    check("product_description").isLength({ min: 5 }),
    check("self_life").not().isEmpty(),
  ],
  productsControllers.updateProduct, 
);

router.delete("/product/:pid", productsControllers.deleteProduct);



module.exports = router;
