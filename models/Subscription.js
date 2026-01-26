const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ["weekly", "monthly", "quarterly", "yearly", "once"],
    },
    nextPaymentDate: { type: Date, required: true },
    category: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
