const Subscription = require("../models/Subscription");

const getDashboard = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id }).sort({
      nextPaymentDate: 1,
    });
    res.render("dashboard", { subscriptions });
  } catch (err) {
    console.error("Dashboard error", err.message);
    res.status(500).send("Failed to load dashboard");
  }
};

const getAddForm = (req, res) => {
  res.render("add", { error: null });
};

const createSubscription = async (req, res) => {
  const { name, price, currency, billingCycle, nextPaymentDate, category } =
    req.body;
  try {
    await Subscription.create({
      user: req.user._id,
      name,
      price: Number(price),
      currency: currency || "USD",
      billingCycle,
      nextPaymentDate,
      category,
    });
    res.redirect("/subscriptions");
  } catch (err) {
    console.error("Create subscription error", err.message);
    res
      .status(400)
      .render("add", {
        error: "Unable to create subscription. Check your fields.",
      });
  }
};

const deleteSubscription = async (req, res) => {
  const { id } = req.params;
  try {
    await Subscription.findOneAndDelete({ _id: id, user: req.user._id });
    res.redirect("/subscriptions");
  } catch (err) {
    console.error("Delete subscription error", err.message);
    res.status(500).send("Unable to delete subscription");
  }
};

module.exports = {
  getDashboard,
  getAddForm,
  createSubscription,
  deleteSubscription,
};
