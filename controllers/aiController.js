const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- CONFIGURATION ---
const useMock = !process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (!useMock) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Utilisez ici le modèle qui a fonctionné pour vous (ex: "gemini-1.5-flash" ou "gemini-pro")
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

// --- FONCTION UTILITAIRE DE NETTOYAGE ---
// C'est le secret : cette fonction enlève les ```json et autres parasites
function cleanJSON(text) {
  if (!text) return "{}";
  // Enlever les balises markdown ```json ... ```
  let cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  // Trouver le premier { et le dernier }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

// --- CONTROLEURS ---

const autofill = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing name" });

  if (useMock) {
    return res.json({
      price: 9.99,
      category: "Divertissement",
      cycle: "monthly",
      mock: true,
    });
  }

  try {
    const prompt = `
      Tu es une API JSON. Estime les détails de l'abonnement "${name}".
      Réponds UNIQUEMENT avec ce JSON :
      {"price": Number, "category": String, "billingCycle": String}
      
      Catégories possibles : ["Divertissement", "Musique", "Professionnel", "Nourriture", "Sport", "Autre"].
      Cycles possibles : ["monthly", "yearly", "weekly"].
      Exemple pour Netflix : {"price": 13.49, "category": "Divertissement", "billingCycle": "monthly"}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // On nettoie avant de parser
    const cleanedText = cleanJSON(responseText);
    const parsed = JSON.parse(cleanedText);

    return res.json(parsed);
  } catch (err) {
    console.error("Gemini autofill error:", err.message);
    // En cas d'erreur, on renvoie des valeurs par défaut plutôt qu'une erreur 500
    return res.json({ price: 0, category: "Autre", billingCycle: "monthly" });
  }
};

const generateCancellation = async (req, res) => {
  const { name, price, currency, billingCycle, nextPaymentDate, category } =
    req.body;
  if (!name)
    return res.status(400).json({ error: "Missing subscription name" });

  if (useMock) {
    return res.json({
      letter: "Mode simulation (pas de clé API).",
      mock: true,
    });
  }

  try {
    const prompt = `
      Rédige une lettre de résiliation pour :
      Service: ${name}
      Catégorie: ${category}
      Prix: ${price} ${currency}
      Cycle: ${billingCycle}
      Prochaine échéance: ${nextPaymentDate}
      
      La lettre doit être polie, formelle et demander l'arrêt des prélèvements.
      Ne mets pas de politesses avant ou après le corps de la lettre (pas de "Voici la lettre").
    `;

    const result = await model.generateContent(prompt);
    const letter = result.response.text();

    // Pas besoin de JSON parse ici, c'est du texte brut
    return res.json({ letter });
  } catch (err) {
    console.error("Gemini cancellation error:", err.message);
    return res.status(500).json({ error: "Impossible de générer la lettre" });
  }
};

module.exports = { autofill, generateCancellation };
