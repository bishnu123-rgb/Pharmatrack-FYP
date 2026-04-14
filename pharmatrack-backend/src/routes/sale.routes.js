const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { createSale, getSales, getSaleById, getSalesStats } = require("../controllers/sale.controller");

router.get("/", auth.auth, getSales);
router.get("/stats", auth.auth, getSalesStats);
router.get("/:id", auth.auth, getSaleById);
router.post("/", auth.auth, auth.authorize(["admin", "pharmacist", "staff"]), createSale);

module.exports = router;
