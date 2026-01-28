const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Subscription = require("../models/Subscription");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendReminderEmail = async (
  recipientEmail,
  username,
  subscriptionName,
  price,
  currency,
  daysLeft,
  dueDate,
) => {
  const mailOptions = {
    from: `"SubTracker" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `🔔 Rappel : ${subscriptionName} arrive à échéance !`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4e73df;">Bonjour ${username},</h2>
        <p>Votre abonnement <strong>${subscriptionName}</strong> va être renouvelé dans <strong>${daysLeft} jours</strong>.</p>
        
        <div style="background-color: #f8f9fc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Montant :</strong> ${price} ${currency}</p>
          <p style="margin: 0;"><strong>Date prévue :</strong> ${new Date(dueDate).toLocaleDateString("fr-FR")}</p>
        </div>
        
        <p style="font-size: 0.9em; color: #666;">Ce message vous a été envoyé automatiquement à l'adresse ${recipientEmail}.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(` Email envoyé avec succès à : ${recipientEmail}`);
  } catch (error) {
    console.error(` Erreur d'envoi à ${recipientEmail}:`, error);
  }
};

const initNotificationService = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("---  Démarrage de la vérification des échéances ---");

    try {
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + 3);

      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const subscriptionsDue = await Subscription.find({
        nextPaymentDate: { $gte: startOfDay, $lte: endOfDay },
      }).populate("user");

      if (subscriptionsDue.length === 0) {
        console.log("Ø Aucun abonnement à échéance dans 3 jours.");
        return;
      }

      console.log(
        ` ${subscriptionsDue.length} abonnement(s) trouvé(s). Envoi en cours...`,
      );

      for (const sub of subscriptionsDue) {
        if (sub.user && sub.user.email) {
          await sendReminderEmail(
            sub.user.email,
            sub.user.username,
            sub.name,
            sub.price,
            sub.currency,
            3,
            sub.nextPaymentDate,
          );

          await sleep(2000);
        } else {
          console.warn(
            ` Abonnement "${sub.name}" ignoré : Utilisateur ou email manquant.`,
          );
        }
      }
      console.log("---  Fin de la session d'envoi ---");
    } catch (error) {
      console.error(" Erreur critique service notification:", error);
    }
  });

  console.log(
    "Service de notification activé (Vérification quotidienne à 09h00).",
  );
};

module.exports = initNotificationService;
