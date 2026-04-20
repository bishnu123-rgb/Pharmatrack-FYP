const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { generateAlerts, getAlerts, markAsRead } = require("../controllers/alert.controller");

router.get("/", auth.auth, getAlerts);
router.post("/generate", auth.auth, auth.authorize(["admin", "pharmacist"]), generateAlerts);
router.put("/mark-read", auth.auth, markAsRead);

module.exports = router;
