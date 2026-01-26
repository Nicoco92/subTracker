const User = require("../models/User");

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/auth/login");
  }
  next();
};

const attachUser = async (req, res, next) => {
  if (!req.session.userId) return next();
  try {
    const user = await User.findById(req.session.userId).select("-password");
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    console.error("Failed to attach user", err.message);
    next();
  }
};

module.exports = { requireAuth, attachUser };
