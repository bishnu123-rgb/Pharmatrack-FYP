const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplier.controller");
const { auth, authorize } = require("../middleware/auth.middleware");

router.get("/", auth, supplierController.getSuppliers);
router.post("/", auth, authorize(["admin", "pharmacist"]), supplierController.createSupplier);
router.put("/:id", auth, authorize(["admin", "pharmacist"]), supplierController.updateSupplier);
router.delete("/:id", auth, authorize(["admin"]), supplierController.deleteSupplier);
router.patch("/:id/toggle-status", auth, authorize(["admin", "pharmacist"]), supplierController.toggleSupplierStatus);

module.exports = router;
