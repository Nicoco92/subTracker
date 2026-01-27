const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const Subscription = require("../models/Subscription");

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

const createLinkToken = async (req, res) => {
  try {
    const response = await client.linkTokenCreate({
      user: { client_user_id: req.user._id.toString() },
      client_name: "SubTracker",
      products: ["transactions"],
      country_codes: ["FR", "US"],
      language: "fr",
    });
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error(
      "Erreur createLinkToken:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({ error: error.message });
  }
};

const exchangePublicToken = async (req, res) => {
  const { public_token } = req.body;
  try {
    const response = await client.itemPublicTokenExchange({
      public_token,
    });
    const accessToken = response.data.access_token;

    req.session.plaidAccessToken = accessToken;

    res.json({ success: true });
  } catch (error) {
    console.error(
      "Erreur exchangeToken:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({ error: error.message });
  }
};

const syncTransactions = async (req, res) => {
  const accessToken = req.session.plaidAccessToken;
  if (!accessToken)
    return res.status(400).json({ error: "Pas de compte connecté" });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const response = await client.transactionsGet({
      access_token: accessToken,
      start_date: thirtyDaysAgo.toISOString().split("T")[0],
      end_date: now.toISOString().split("T")[0],
    });

    const transactions = response.data.transactions;

    const newSubscriptions = transactions
      .filter((tx) => tx.amount > 0)
      .map((tx) => ({
        user: req.user._id,
        name: tx.merchant_name || tx.name,
        price: tx.amount,
        currency: tx.iso_currency_code || "USD",
        billingCycle: "monthly",
        nextPaymentDate: new Date(),
        category: tx.category && tx.category[0] ? tx.category[0] : "Autre",
      }));

    if (newSubscriptions.length > 0) {
      await Subscription.insertMany(newSubscriptions);
    }

    res.json({ success: true, count: newSubscriptions.length });
  } catch (error) {
    console.error(
      "Erreur syncTransactions:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createLinkToken, exchangePublicToken, syncTransactions };
