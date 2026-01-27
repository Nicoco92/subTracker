const express = require("express");
const {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
} = require("../controllers/plaidController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/create_link_token", requireAuth, createLinkToken);
router.post("/exchange_public_token", requireAuth, exchangePublicToken);
router.get("/transactions", requireAuth, syncTransactions);

module.exports = router;
