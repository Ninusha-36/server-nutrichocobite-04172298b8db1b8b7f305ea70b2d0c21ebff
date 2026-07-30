const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const mongoose = require("mongoose");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: "SS_03",
      message: "Invalid inputs passed, please check your data.",
    });
  }

  const { username, password, email, phone, type } = req.body;
  let ExistUser;
  try {
    ExistUser = await User.findOne({ email: email });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Signing up failed, please try again later.",
    });
  }

  if (ExistUser) {
    return res.status(422).json({
      status: "SS_03",
      message: "User already exists, please login instead.",
    });
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Signing up failed, please try again later.",
    });
  }

  const signupData = new User({
    username,
    password: hashedPassword,
    email,
    phone,
    type,
    profile: null,
    gender: null,
  });

  try {
    await signupData.save();
  } catch (err) {
    return res.status(422).json({
      status: "SS_03",
      message: "Email already exists. Please login.",
    });
  }

  let token;
  try {
    token = jwt.sign(
      { userId: signupData.id, email: signupData.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Signing up failed, please try again later.",
    });
  }

  return res.status(201).json({
    status: "SS_02",
    message: "Signup successful.",
    userId: signupData.id,
    email: signupData.email,
    token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let ExistUser;
  try {
    ExistUser = await User.findOne({ email: email });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not login. Please try again.",
    });
  }

  if (!ExistUser) {
    return res.status(401).json({
      status: "SS_03",
      message: "Invalid credentials, could not log you in.",
    });
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, ExistUser.password);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Logging in failed, please try again later.",
    });
  }

  if (!isValidPassword) {
    return res.status(401).json({
      status: "SS_03",
      message: "Invalid credentials, could not log you in.",
    });
  }

  let token;
  try {
    token = jwt.sign(
      { userId: ExistUser.id, email: ExistUser.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Logging in failed, please try again later.",
    });
  }

  return res.json({
    status: "SS_02",
    message: "Login successful.",
    userId: ExistUser.id,
    email: ExistUser.email,
    token,
  });
};

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;
  let ExistUser;
  try {
    ExistUser = await User.findById(userId, "-password");
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching user failed, please try again later.",
    });
  }

  if (!ExistUser) {
    return res.status(404).json({
      status: "SS_03",
      message: "Could not find user for the provided id.",
    });
  }

  return res.json({
    status: "SS_01",
    message: "User fetched successfully.",
    data: ExistUser.toObject({ getters: true }),
  });
};

const updateUser = async (req, res, next) => {
  const userId = req.params.uid;
  let ExistUser;
  try {
    ExistUser = await User.findById(userId, "-password");
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not update user, please try again later.",
    });
  }

  if (!ExistUser) {
    return res.status(404).json({
      status: "SS_03",
      message: "Could not find user for this id.",
    });
  }

  const { username, email, phone, gender } = req.body;

  ExistUser.username = username;
  ExistUser.email = email;
  ExistUser.phone = phone;
  ExistUser.gender = gender;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await ExistUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Updating user details failed, please try again.",
    });
  }

  return res.json({
    status: "SS_04",
    message: "User details updated successfully.",
    data: ExistUser,
  });
};

const updateUserProfile = async (req, res, next) => {
  const userId = req.params.uid;
  let ExistUser;
  try {
    ExistUser = await User.findById(userId, "-password");
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not update profile image.",
    });
  }

  if (!ExistUser) {
    return res.status(404).json({
      status: "SS_03",
      message: "Could not find user for this id.",
    });
  }

  const { image } = req.body;
  let updatedImage = ExistUser.profile || null;

  if (req.file) {
    if (ExistUser.profile) {
      fs.unlink(ExistUser.profile, (err) => {
        if (err) console.log(err);
      });
    }
    updatedImage = req.file.path;
  } else if (!image) {
    if (ExistUser.profile) {
      fs.unlink(ExistUser.profile, (err) => {
        if (err) console.log(err);
      });
    }
    updatedImage = null;
  }

  ExistUser.profile = updatedImage;

  try {
    await ExistUser.save();
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Something went wrong, could not update profile.",
    });
  }

  return res.json({
    status: "SS_04",
    message: "User profile updated successfully.",
    data: ExistUser,
  });
};

const updateUserPassword = async (req, res, next) => {
  const userId = req.params.uid;
  let ExistUser;
  try {
    ExistUser = await User.findById(userId);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Could not find user, please try again later.",
    });
  }

  if (!ExistUser) {
    return res.status(404).json({
      status: "SS_03",
      message: "Could not find user for this id.",
    });
  }

  const { oldPassword, newPassword } = req.body;

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(oldPassword, ExistUser.password);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Reset password failed, please try again later.",
    });
  }

  if (!isValidPassword) {
    return res.status(401).json({
      status: "SS_03",
      message: "Password does not match.",
    });
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(newPassword, 12);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Password reset failed, please try again later.",
    });
  }

  ExistUser.password = hashedPassword;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await ExistUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Password reset failed, please try again.",
    });
  }

  return res.json({
    status: "SS_04",
    message: "Password updated successfully.",
  });
};

exports.login = login;
exports.signup = signup;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.updateUserProfile = updateUserProfile;
exports.updateUserPassword = updateUserPassword;