const express = require("express");
const {
  register,
  login,
  logout,
  getRegisterForm,
  getLoginForm,
} = require("../controllers/authController");

const router = express.Router();

router.get("/register", getRegisterForm);
router.post("/register", register);

router.get("/login", getLoginForm);
router.post("/login", login);

router.get("/logout", logout);

module.exports = router;
