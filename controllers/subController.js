const Subscription = require("../models/Subscription");
const { createEvents } = require("ics"); // Pour l'export calendrier

// Afficher le dashboard
const getDashboard = async (req, res) => {
  try {
    // 1. Récupérer les abonnements
    const subscriptions = await Subscription.find({ user: req.session.userId });

    // 2. Vérifier si l'utilisateur a connecté sa banque (Token Plaid en session)
    // C'est cette variable qui gère l'affichage du bouton !
    const plaidConnected = !!req.session.plaidAccessToken;

    // 3. Envoyer tout à la vue
    res.render("dashboard", {
      subscriptions,
      currentUser: req.user,
      plaidConnected, // <--- INDISPENSABLE
    });
  } catch (err) {
    console.error("Erreur Dashboard:", err);
    res.status(500).render("dashboard", {
      subscriptions: [],
      currentUser: req.user,
      error: "Erreur serveur",
      plaidConnected: false,
    });
  }
};

// Ajouter un abonnement manuellement
const addSubscription = async (req, res) => {
  const { name, price, currency, billingCycle, nextPaymentDate, category } =
    req.body;
  try {
    await Subscription.create({
      user: req.session.userId,
      name,
      price,
      currency,
      billingCycle,
      nextPaymentDate,
      category,
    });
    res.redirect("/subscriptions");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'ajout");
  }
};

// Supprimer un abonnement
const deleteSubscription = async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.redirect("/subscriptions");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la suppression");
  }
};

// Mettre à jour un abonnement
const updateSubscription = async (req, res) => {
  const { name, price, currency, billingCycle, nextPaymentDate, category } =
    req.body;
  try {
    await Subscription.findByIdAndUpdate(req.params.id, {
      name,
      price,
      currency,
      billingCycle,
      nextPaymentDate,
      category,
    });
    res.redirect("/subscriptions");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la mise à jour");
  }
};

// Afficher le formulaire d'ajout
const getAddForm = (req, res) => {
  res.render("add", { currentUser: req.user });
};

// Exporter le calendrier ICS
const exportCalendar = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.session.userId });

    if (!subscriptions || subscriptions.length === 0) {
      return res.redirect("/subscriptions");
    }

    const events = subscriptions.map((sub) => {
      const date = new Date(sub.nextPaymentDate);

      let recurrenceRule = "FREQ=MONTHLY";
      if (sub.billingCycle === "yearly") recurrenceRule = "FREQ=YEARLY";
      if (sub.billingCycle === "weekly") recurrenceRule = "FREQ=WEEKLY";
      if (sub.billingCycle === "quarterly")
        recurrenceRule = "FREQ=MONTHLY;INTERVAL=3";

      return {
        title: `Paiement ${sub.name} (${sub.price} ${sub.currency})`,
        description: `Renouvellement abonnement ${sub.category}`,
        start: [date.getFullYear(), date.getMonth() + 1, date.getDate()],
        duration: { minutes: 30 },
        recurrenceRule: recurrenceRule,
        categories: ["Dépense", "Abonnement"],
        status: "CONFIRMED",
        busyStatus: "FREE",
      };
    });

    createEvents(events, (error, value) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .send("Erreur lors de la génération du calendrier");
      }
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="mes-abonnements.ics"',
      );
      res.send(value);
    });
  } catch (err) {
    console.error("Erreur export:", err);
    res.redirect("/subscriptions");
  }
};

module.exports = {
  getDashboard,
  addSubscription,
  deleteSubscription,
  updateSubscription,
  getAddForm,
  exportCalendar,
};
