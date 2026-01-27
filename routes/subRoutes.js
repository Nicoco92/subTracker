const express = require("express");
const {
  getDashboard,
  getAddForm,
  createSubscription,
  deleteSubscription,
  updateSubscription,
} = require("../controllers/subController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getDashboard);
router.get("/add", requireAuth, getAddForm);
router.post("/add", requireAuth, createSubscription);
router.post("/:id/update", requireAuth, updateSubscription);
router.post("/:id/delete", requireAuth, deleteSubscription);

module.exports = router;
