const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function calculateNextPaymentDate(lastTransactionDateStr) {
  const lastDate = new Date(lastTransactionDateStr);
  const today = new Date();
  let nextDate = new Date(lastDate);

  while (nextDate <= today) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  return nextDate;
}

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
    const cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleanedText);
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

    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user._id, { plaidConnected: true });

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
    const lookbackDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let transactions = [];
    let retries = 5;

    while (retries > 0) {
      try {
        const response = await client.transactionsGet({
          access_token: accessToken,
          start_date: lookbackDate.toISOString().split("T")[0],
          end_date: now.toISOString().split("T")[0],
        });
        transactions = response.data.transactions;
        break;
      } catch (err) {
        const errorCode = err.response?.data?.error_code;
        if (errorCode === "PRODUCT_NOT_READY") {
          console.log(`Plaid n'est pas prêt. Attente... (${retries})`);
          retries--;
          await sleep(2000);
          continue;
        }
        throw err;
      }
    }

    if (retries === 0) {
      return res.status(202).json({
        error: "Transactions en cours de traitement. Réessayez plus tard.",
      });
    }

    const groupedTransactions = {};
    transactions.forEach((tx) => {
      if (tx.amount <= 0) return;
      const name = (tx.merchant_name || tx.name).trim();
      if (!groupedTransactions[name]) {
        groupedTransactions[name] = [];
      }
      groupedTransactions[name].push(tx);
    });

    const potentialSubscriptions = [];

    for (const [name, txList] of Object.entries(groupedTransactions)) {
      if (txList.length >= 1) {
        txList.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestTx = txList[0];

        const calculatedNextDate = calculateNextPaymentDate(latestTx.date);

        potentialSubscriptions.push({
          originalName: name,
          amount: latestTx.amount,
          currency: latestTx.iso_currency_code || "USD",
          nextDate: calculatedNextDate,
        });
      }
    }

    const namesToCategorize = potentialSubscriptions.map((s) => s.originalName);
    const categorizedMap =
      await categorizeTransactionsWithAI(namesToCategorize);

    const newSubscriptions = potentialSubscriptions.map((sub) => {
      return {
        user: req.user._id,
        name: sub.originalName,
        price: sub.amount,
        currency: sub.currency,
        billingCycle: "monthly",
        nextPaymentDate: sub.nextDate,
        category: categorizedMap[sub.originalName] || "Autre",
      };
    });

    const filteredNewSubscriptions = [];
    for (const sub of newSubscriptions) {
      const exists = await Subscription.findOne({
        user: sub.user,
        name: sub.name,
        price: sub.price,
        currency: sub.currency,
        nextPaymentDate: sub.nextPaymentDate,
      });
      if (!exists) {
        filteredNewSubscriptions.push(sub);
      }
    }

    if (filteredNewSubscriptions.length > 0) {
      await Subscription.insertMany(filteredNewSubscriptions);
    }

    res.json({
      success: true,
      count: filteredNewSubscriptions.length,

      // Les abonnements que l'IA a trouvé
      subscriptions_found: filteredNewSubscriptions,

      // La liste brute donnée par Plaid (pour vérification)
      raw_plaid_transactions: transactions,
    });
  } catch (error) {
    console.error(
      "Erreur syncTransactions:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({ error: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id });
    res.render("dashboard", {
      subscriptions,
      plaidConnected: req.user.plaidConnected || false,
    });
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
};

const createSandboxPublicToken = async (req, res) => {
  try {
    // On demande à Plaid de créer un faux token pour la banque "ins_109508" (Une banque de test standard)
    const publicTokenResponse = await client.sandboxPublicTokenCreate({
      institution_id: "ins_109508",
      initial_products: ["transactions"],
    });
    res.json({ public_token: publicTokenResponse.data.public_token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
  getDashboard,
  createSandboxPublicToken,
};
