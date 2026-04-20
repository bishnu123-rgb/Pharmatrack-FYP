const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

// Chat with AI Assistant
router.post('/chat', aiController.chat);

// Dedicated Drug Interaction Analysis (strict, isolated from chatbot)
router.post('/interaction-check', aiController.checkInteraction);

// Admin Strategic Insights (Smart Inventory Analyst) - Restricted to Management
router.post('/inventory-insights', auth, authorize(["admin", "pharmacist"]), aiController.getInventoryInsights);

module.exports = router;

