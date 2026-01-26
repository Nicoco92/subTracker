const express = require("express");
const {
  renderLogin,
  renderRegister,
  register,
  login,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.get("/login", renderLogin);
router.get("/register", renderRegister);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
