const express = require("express");
const { check } = require("express-validator");
const CheckAuth = require('../middleware/check-auth')
const fileUpload = require('../middleware/file-upload')


const usersControllers = require("../controllers/users-controllers");

const router = express.Router();

router.post(
  "/signup",
  [
    check("username").not().isEmpty(),
    check("email").not().isEmpty(),
    check("phone").not().isEmpty(),
    check("password").isLength({ min: 6 }),
    check("type").not().isEmpty(),
  ],
  usersControllers.signup,
);

router.post(
  "/login",
  [check("email").not().isEmpty(), check("password").isLength({ min: 6 })],
  usersControllers.login,
);
router.get("/user/:uid/", usersControllers.getUserById);


router.use(CheckAuth)

router.post(
  "/user/:uid/",
  [
    check("username").not().isEmpty(),
    check("email").not().isEmpty(),
    check("phone").not().isEmpty(),
    check("gender").not().isEmpty(),
  ],
  usersControllers.updateUser,
);

router.post(
  "/reset_password/:uid/",
  [
    check("oldPassword").not().isEmpty(),
    check("newPassword").not().isEmpty(),
  ],
  usersControllers.updateUserPassword,
);

router.patch(
  "/update_profile/:uid/",
   fileUpload.single("image"),
  usersControllers.updateUserProfile,
);

module.exports = router;
