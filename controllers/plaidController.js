const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Subscription = require("../models/Subscription");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

let genAI = null;
let model = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

async function categorizeTransactionsWithAI(transactionNames) {
  if (!transactionNames || transactionNames.length === 0 || !model) return {};

  try {
    const prompt = `
      Tu es un assistant financier. Voici une liste de noms de transactions :
      ${JSON.stringify(transactionNames)}

      Pour chaque nom, attribue la catégorie la plus pertinente parmi cette liste exacte :
      ["Divertissement", "Musique", "Professionnel", "Nourriture", "Sport", "Autre"].

      Réponds UNIQUEMENT avec un objet JSON où :
      - Clé = Nom de la transaction
      - Valeur = Catégorie trouvée
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Erreur Gemini catégorisation:", err.message);
    return {};
  }
}

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

    let transactions = [];
    let retries = 5;

    while (retries > 0) {
      try {
        const response = await client.transactionsGet({
          access_token: accessToken,
          start_date: thirtyDaysAgo.toISOString().split("T")[0],
          end_date: now.toISOString().split("T")[0],
        });

        transactions = response.data.transactions;
        break;
      } catch (err) {
        const errorCode = err.response?.data?.error_code;

        if (errorCode === "PRODUCT_NOT_READY") {
          console.log(
            `Plaid n'est pas prêt. Tentative restante : ${retries}. Attente 2s...`,
          );
          retries--;
          await sleep(2000);
          continue;
        }

        throw err;
      }
    }

    if (retries === 0) {
      return res.status(202).json({
        error:
          "Les transactions sont en cours de traitement. Réessayez dans une minute.",
      });
    }

    const expenses = transactions.filter((tx) => tx.amount > 0);
    const transactionNames = expenses.map((tx) => tx.merchant_name || tx.name);

    const categorizedMap = await categorizeTransactionsWithAI(transactionNames);

    const newSubscriptions = expenses.map((tx) => {
      const name = tx.merchant_name || tx.name;
      return {
        user: req.user._id,
        name: name,
        price: tx.amount,
        currency: tx.iso_currency_code || "USD",
        billingCycle: "monthly",
        nextPaymentDate: new Date(),
        category: categorizedMap[name] || "Autre",
      };
    });

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
