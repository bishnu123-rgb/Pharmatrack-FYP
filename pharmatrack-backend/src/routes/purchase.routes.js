const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { createPurchase, getPurchases } = require("../controllers/purchase.controller");

router.get("/", auth.auth, getPurchases);
router.post("/", auth.auth, auth.authorize(["admin", "pharmacist"]), createPurchase);

module.exports = router;
