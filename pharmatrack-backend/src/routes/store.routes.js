const express = require("express");
const router = express.Router();
const storeController = require("../controllers/store.controller");

// All routes are PUBLIC — no auth middleware
router.get("/medicines", storeController.getPublicMedicines);
router.get("/medicines/:id", storeController.getMedicineDetail);
router.get("/categories", storeController.getPublicCategories);
router.post("/notify-stock", storeController.requestStockNotification);

module.exports = router;
