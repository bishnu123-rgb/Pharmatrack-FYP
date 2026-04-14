const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { createPurchase, getPurchases, getPurchaseById } = require("../controllers/purchase.controller");

router.get("/", auth.auth, getPurchases);
router.get("/:id", auth.auth, getPurchaseById);
router.post("/", auth.auth, auth.authorize(["admin", "pharmacist"]), createPurchase);

module.exports = router;
