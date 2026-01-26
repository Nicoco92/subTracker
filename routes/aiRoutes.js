const express = require("express");
const {
  autofill,
  generateCancellation,
} = require("../controllers/aiController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/autofill", requireAuth, autofill);
router.post("/generate-cancellation", requireAuth, generateCancellation);

module.exports = router;
