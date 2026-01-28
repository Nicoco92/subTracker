const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getDashboard,
  getAddPage,
  addSubscription,
  deleteSubscription,
  updateSubscription
} = require("../controllers/subController");

router.get("/", requireAuth, getDashboard);
router.get("/add", requireAuth, getAddPage);
router.post("/add", requireAuth, addSubscription);
router.post("/:id/delete", requireAuth, deleteSubscription);
router.post("/:id/update", requireAuth, updateSubscription);

module.exports = router;
