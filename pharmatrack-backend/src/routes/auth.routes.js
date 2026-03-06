const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-code", authController.resendVerificationCode);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);


module.exports = router;

