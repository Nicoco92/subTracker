const bcrypt = require("bcryptjs");
const User = require("../models/User");

const renderLogin = (req, res) => {
  if (req.user) return res.redirect("/subscriptions");
  res.render("auth/login", { error: null });
};

const renderRegister = (req, res) => {
  if (req.user) return res.redirect("/subscriptions");
  res.render("auth/register", { error: null });
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .render("auth/register", { error: "Email already in use." });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    req.session.userId = user._id;
    res.redirect("/subscriptions");
  } catch (err) {
    console.error("Register error", err.message);
    res
      .status(500)
      .render("auth/register", { error: "Unable to register. Try again." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .render("auth/login", { error: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .render("auth/login", { error: "Invalid credentials." });
    }
    req.session.userId = user._id;
    res.redirect("/subscriptions");
  } catch (err) {
    console.error("Login error", err.message);
    res
      .status(500)
      .render("auth/login", { error: "Unable to login. Try again." });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
};

module.exports = { renderLogin, renderRegister, register, login, logout };
