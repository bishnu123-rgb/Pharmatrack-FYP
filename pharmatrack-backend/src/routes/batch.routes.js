const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const {
  createBatch,
  getBatches,
  updateBatch,
  deleteBatch
} = require("../controllers/batch.controller");

router.post("/", auth.auth, auth.authorize(["admin", "pharmacist"]), createBatch);
router.get("/", auth.auth, getBatches);
router.put("/:id", auth.auth, auth.authorize(["admin", "pharmacist"]), updateBatch);
router.delete("/:id", auth.auth, auth.authorize(["admin"]), deleteBatch);

module.exports = router;
