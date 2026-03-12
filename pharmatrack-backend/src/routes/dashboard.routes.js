const express = require("express");
const router = express.Router();

console.log("🔥 DASHBOARD ROUTES LOADED");

const { getDashboardSummary } = require("../controllers/dashboard.controller");
const auth = require("../middleware/auth.middleware");

router.get("/summary", auth.auth, getDashboardSummary);

module.exports = router;
