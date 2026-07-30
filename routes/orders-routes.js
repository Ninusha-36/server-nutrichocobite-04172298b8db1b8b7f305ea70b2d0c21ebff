const express = require("express");
const { check } = require("express-validator");
const CheckAuth = require("../middleware/check-auth");

const ordersControllers = require("../controllers/orders-controllers");

const router = express.Router();


router.use(CheckAuth);

router.post(
  "/confirm-order",
  [
    check("user_id").not().isEmpty(),
    check("address_id").not().isEmpty(),
    check("payment_method").not().isEmpty(),
  ],
  ordersControllers.confirmOrder,
);

router.get("/my-orders/:uid", ordersControllers.getOrdersByUserId)
router.delete("/cancel-order/:oid", ordersControllers.cancelOrder)


module.exports = router;
