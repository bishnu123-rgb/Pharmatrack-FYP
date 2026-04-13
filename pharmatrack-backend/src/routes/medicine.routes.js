const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine
} = require("../controllers/medicine.controller");

const upload = require("../middleware/upload.middleware");

router.post("/", auth.auth, auth.authorize(["admin", "pharmacist"]), upload.single("image"), createMedicine);
router.get("/", auth.auth, getMedicines);
router.get("/:id", auth.auth, getMedicineById);
router.put("/:id", auth.auth, auth.authorize(["admin", "pharmacist"]), upload.single("image"), updateMedicine);
router.delete("/:id", auth.auth, auth.authorize(["admin"]), deleteMedicine);

module.exports = router;
