const express = require("express");
const router = express.Router();
const storeController = require("../controllers/store.controller");

const { auth } = require("../middleware/auth.middleware");

// Public Store Routes
router.get("/medicines", storeController.getPublicMedicines);
router.get("/medicines/:id", storeController.getMedicineDetail);
router.get("/categories", storeController.getPublicCategories);
router.post("/notify-stock", storeController.requestStockNotification);

// Admin/Staff Management Routes
router.get("/manage/requests", auth, storeController.getAllStockRequests);
router.put("/manage/requests/:id/fulfill", auth, storeController.fulfillStockRequest);



module.exports = router;
