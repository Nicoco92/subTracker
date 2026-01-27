const User = require("../models/User");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.render("auth/register", {
        error: "Cet email est déjà utilisé",
      });
    }

    user = await User.create({ username, email, password });

    req.session.userId = user._id;
    res.redirect("/subscriptions");
  } catch (err) {
    console.error(err);
    res.render("auth/register", { error: "Erreur lors de l'inscription" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("auth/login", {
        error: "Email ou mot de passe incorrect",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("auth/login", {
        error: "Email ou mot de passe incorrect",
      });
    }

    req.session.userId = user._id;
    res.redirect("/subscriptions");
  } catch (err) {
    console.error(err);
    res.render("auth/login", { error: "Erreur lors de la connexion" });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
};

const getLoginForm = (req, res) => res.render("auth/login", { error: null });
const getRegisterForm = (req, res) =>
  res.render("auth/register", { error: null });

module.exports = {
  register,
  login,
  logout,
  getLoginForm,
  getRegisterForm,
};
