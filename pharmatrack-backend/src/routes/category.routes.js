const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require("../controllers/category.controller");

router.post("/", auth.auth, auth.authorize(["admin", "pharmacist"]), createCategory);
router.get("/", auth.auth, getCategories);
router.put("/:id", auth.auth, auth.authorize(["admin", "pharmacist"]), updateCategory);
router.delete("/:id", auth.auth, auth.authorize(["admin"]), deleteCategory);

module.exports = router;
