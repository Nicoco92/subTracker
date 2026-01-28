const Subscription = require("../models/Subscription");

const getDashboard = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }
    const subscriptions = await Subscription.find({ user: req.user._id });
    res.render("dashboard", { 
      subscriptions,
      plaidConnected: req.user.plaidConnected || false
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Erreur serveur");
  }
};

const getAddPage = (req, res) => {
  res.render("add");
};

const addSubscription = async (req, res) => {
  try {
    const { name, price, currency, billingCycle, nextPaymentDate, category } = req.body;
    await Subscription.create({
      user: req.user._id,
      name,
      price,
      currency,
      billingCycle,
      nextPaymentDate,
      category
    });
    res.redirect("/subscriptions");
  } catch (error) {
    res.status(500).send("Erreur lors de l'ajout");
  }
};

const deleteSubscription = async (req, res) => {
  try {
    await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.redirect("/subscriptions");
  } catch (error) {
    res.status(500).send("Erreur lors de la suppression");
  }
};

const updateSubscription = async (req, res) => {
  try {
    const { name, price, currency, billingCycle, nextPaymentDate, category } = req.body;
    await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, price, currency, billingCycle, nextPaymentDate, category }
    );
    res.redirect("/subscriptions");
  } catch (error) {
    res.status(500).send("Erreur lors de la mise à jour");
  }
};

module.exports = {
  getDashboard,
  getAddPage,
  addSubscription,
  deleteSubscription,
  updateSubscription
};
