const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Chat with AI Assistant
router.post('/chat', aiController.chat);

// Dedicated Drug Interaction Analysis (strict, isolated from chatbot)
router.post('/interaction-check', aiController.checkInteraction);

// Admin Strategic Insights (Smart Inventory Analyst)
router.post('/inventory-insights', aiController.getInventoryInsights);

module.exports = router;
