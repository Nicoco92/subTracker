const express = require("express");
const {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
  createSandboxPublicToken,
} = require("../controllers/plaidController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/create_link_token", requireAuth, createLinkToken);
router.post("/exchange_public_token", requireAuth, exchangePublicToken);
router.get("/transactions", requireAuth, syncTransactions);
router.get("/sandbox_public_token", createSandboxPublicToken);

module.exports = router;
