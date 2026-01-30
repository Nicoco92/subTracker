const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getDashboard,
  getAddForm,
  addSubscription,
  deleteSubscription,
  updateSubscription,
  exportCalendar,
  getAllSubscriptionsJson,
} = require("../controllers/subController");

router.get("/", requireAuth, getDashboard);
router.get("/add", requireAuth, getAddForm);
router.post("/add", requireAuth, addSubscription);
router.post("/:id/delete", requireAuth, deleteSubscription);
router.post("/:id/update", requireAuth, updateSubscription);
router.get("/calendar/download", requireAuth, exportCalendar);
router.get("/api/list", requireAuth, getAllSubscriptionsJson);

module.exports = router;
