const OpenAI = require("openai");

const useMock = !process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
let client = null;

if (!useMock) {
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const autofill = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing name" });

  if (useMock) {
    return res.json({
      price: 9.99,
      category: "Entertainment",
      cycle: "monthly",
      mock: true,
    });
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Estime le prix, la categorie et le cycle pour le service ${name}. Reponds en JSON pur : {"price": Number, "category": String, "cycle": String}.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return res.json(parsed);
  } catch (err) {
    console.error("AI autofill error", err.message);
    return res.status(500).json({ error: "Autofill failed" });
  }
};

const generateCancellation = async (req, res) => {
  const { name, price, currency, billingCycle, nextPaymentDate, category } =
    req.body;
  if (!name)
    return res.status(400).json({ error: "Missing subscription name" });

  if (useMock) {
    const letter = `Objet: Resiliation de l'abonnement ${name}\n\nJe souhaite resiler mon abonnement ${name} (categorie: ${category || "N/A"}) facture ${price || "N/A"} ${currency || ""} sur un cycle ${billingCycle || "N/A"}. Merci de confirmer la prise en compte avant ${nextPaymentDate || "la prochaine echeance"}.\n\nCordialement,`;
    return res.json({ letter, mock: true });
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: `Redige une lettre formelle de resiliation pour l'abonnement suivant:\nNom: ${name}\nPrix: ${price || "inconnu"} ${currency || ""}\nCycle: ${billingCycle || "inconnu"}\nProchaine echeance: ${nextPaymentDate || "inconnue"}\nCategorie: ${category || "inconnue"}\n\nLe ton doit rester poli et concis.`,
        },
      ],
    });

    const letter = completion.choices[0]?.message?.content?.trim();
    return res.json({ letter });
  } catch (err) {
    console.error("AI cancellation error", err.message);
    return res.status(500).json({ error: "Generation failed" });
  }
};

module.exports = { autofill, generateCancellation };
