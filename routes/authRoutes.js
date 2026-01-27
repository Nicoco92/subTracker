const express = require("express");
const {
  getLoginForm,
  getRegisterForm,
  register,
  login,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.get("/login", getLoginForm);
router.get("/register", getRegisterForm);
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

module.exports = router;
