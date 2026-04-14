const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { generateAlerts, getAlerts } = require("../controllers/alert.controller");

router.get("/", auth.auth, getAlerts);
router.post("/generate", auth.auth, auth.authorize(["admin", "pharmacist"]), generateAlerts);

module.exports = router;
