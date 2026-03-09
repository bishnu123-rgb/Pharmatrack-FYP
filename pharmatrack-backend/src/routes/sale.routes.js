const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { createSale } = require("../controllers/sale.controller");

router.post("/", auth.auth, createSale);

module.exports = router;
