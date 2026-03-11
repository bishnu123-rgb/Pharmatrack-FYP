const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { auth, authorize } = require("../middleware/auth.middleware");

// Profile routes
router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, userController.updateProfile);

// Admin routes
router.get("/", auth, authorize(["admin"]), userController.getAllUsers);
router.put("/:id/status", auth, authorize(["admin"]), userController.updateUserStatus);
router.delete("/:id", auth, authorize(["admin"]), userController.deleteUser);

module.exports = router;
