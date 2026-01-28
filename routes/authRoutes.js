const express = require("express");
const router = express.Router();
const {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
} = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/auth");
const User = require("../models/User");

router.get("/login", getLogin);
router.post("/login", postLogin);
router.get("/register", getRegister);
router.post("/register", postRegister);
router.get("/logout", logout);

router.post("/theme", isAuthenticated, async (req, res) => {
  try {
    const { theme } = req.body;
    if (!["light", "dark", "auto"].includes(theme)) {
      return res.status(400).json({ error: "Invalid theme" });
    }
    await User.findByIdAndUpdate(req.user._id, { themePreference: theme });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
