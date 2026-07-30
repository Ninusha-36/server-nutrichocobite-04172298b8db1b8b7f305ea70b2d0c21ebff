const express = require("express");
const { check } = require("express-validator");
const CheckAuth = require("../middleware/check-auth");

const cartsControllers = require("../controllers/carts-controllers");

const router = express.Router();


router.use(CheckAuth);

router.post(
  "/create-cart",
  [
    check("user_id").not().isEmpty(),
    check("product_id").not().isEmpty(),
    check("size").not().isEmpty(),
    check("quantity").not().isEmpty(),    
    check("price").not().isEmpty(),
  ],
  cartsControllers.createCart,
);
router.post(
  "/multiple-cart",
  cartsControllers.createMultipleCart,
);

router.post(
  "/update-quantity",
  [
    check("user_id").not().isEmpty(),
    check("product_id").not().isEmpty(),
    check("size").not().isEmpty(),
    check("quantity").not().isEmpty(),    
    check("price").not().isEmpty(),
  ],
  cartsControllers.updateQuantity,
);

// Get all users
router.get("/:uid", cartsControllers.getCarts);


router.delete("/cart/:cid", cartsControllers.deleteCart);



module.exports = router;
