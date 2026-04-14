const natural = require('natural');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require('groq-sdk');
const pool = require('../config/db');

class AIService {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;

        this.customerClassifier = new natural.BayesClassifier();
        this.adminClassifier = new natural.BayesClassifier();

        this.medicalDatasetPath = path.join(__dirname, '../data/medical_dataset.json');
        this.adminDatasetPath = path.join(__dirname, '../data/admin_dataset.json');

        this.isTrained = false;
        this.medicalKnowledge = [];
        this.adminKnowledge = [];
        this.genAI = null;
        this.apiKey = null;
        this.groqClient = null;
    }

    async init() {
        try {
            // Load and train local brain first
            const rawKey = process.env.GEMINI_API_KEY;
            this.apiKey = rawKey && rawKey !== 'your_key_here' ? rawKey.trim() : null;
            if (this.apiKey) {
                this.genAI = new GoogleGenerativeAI(this.apiKey);
            }
            // Init Groq client if key present
            const groqKey = process.env.GROQ_API_KEY;
            if (groqKey && groqKey !== 'your_groq_key_here') {
                this.groqClient = new Groq({ apiKey: groqKey.trim() });
            }
            const medData = fs.readFileSync(this.medicalDatasetPath, 'utf8');
            this.medicalKnowledge = JSON.parse(medData);
            this.medicalKnowledge.forEach(item => {
                item.patterns.forEach(pattern => this.customerClassifier.addDocument(pattern, item.intent));
            });
            this.customerClassifier.train();

            const adminData = fs.readFileSync(this.adminDatasetPath, 'utf8');
            this.adminKnowledge = JSON.parse(adminData);
            this.adminKnowledge.forEach(item => {
                item.patterns.forEach(pattern => this.adminClassifier.addDocument(pattern, item.intent));
            });
            this.adminClassifier.train();

            if (this.genAI && this.apiKey) {
                // Triple-Check Loop for Initialization
                const modelsToTest = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];
                let confirmedModel = null;

                for (const mName of modelsToTest) {
                    try {
                        const testModel = this.genAI.getGenerativeModel({ model: mName });
                        await testModel.generateContent("ping");
                        confirmedModel = mName;
                        break;
                    } catch (pingErr) {
                        if (pingErr.message.includes("404")) continue;
                        break;
                    }
                }

                if (confirmedModel) {
                    console.log(`✅ Intelligence Engine: Cloud LLM ACTIVE (${confirmedModel}).`);
                } else {
                    console.log('🛡️ Intelligence Engine: Local NLP System ACTIVE.');
                }
            } else {
                console.log('🛡️ Intelligence Engine: Local NLP System ACTIVE.');
            }

            this.isTrained = true;
            console.log('✅ AI Knowledge Module trained successfully.');
        } catch (error) {
            console.error('❌ AI Initialization Error:', error);
        }
    }

    async getInventoryContext() {
        try {
            const result = await pool.query(`
                SELECT m.medicine_name, c.category_name, m.dosage_form, m.strength, m.aisle_number, m.shelf_location 
                FROM medicines m
                JOIN categories c ON m.category_id = c.category_id
                WHERE m.is_active = TRUE
            `);
            return result.rows.map(m => `${m.medicine_name} (${m.category_name}, ${m.dosage_form}, ${m.strength}) Found at: Aisle ${m.aisle_number}, ${m.shelf_location}`).join(", ");
        } catch (error) {
            console.error("Context Error:", error);
            return "General medical supplies available.";
        }
    }

    // Local Fallback Logic (Previously implemented Super-Fuzzy)
    findBestLocalMatch(message, knowledge) {
        const normalized = message.replace(/[^\w\s]/gi, ' ').toLowerCase().trim();
        const tokens = this.tokenizer.tokenize(normalized);
        const stemmedTokens = tokens.map(t => this.stemmer.stem(t));

        let bestIntent = null;
        let highestScore = 0;

        knowledge.forEach(item => {
            item.patterns.forEach(pattern => {
                const normPattern = pattern.replace(/[^\w\s]/gi, ' ').toLowerCase().trim();
                const patternStemmed = this.tokenizer.tokenize(normPattern).map(t => this.stemmer.stem(t));
                let overlap = 0;
                stemmedTokens.forEach(token => {
                    if (patternStemmed.includes(token)) overlap += 1;
                    else {
                        patternStemmed.forEach(pToken => {
                            const distance = natural.LevenshteinDistance(token, pToken);
                            if (distance === 1 && token.length > 3) overlap += 0.8;
                        });
                    }
                });
                const score = (overlap * 2) / (stemmedTokens.length + patternStemmed.length);
                if (score > highestScore) { highestScore = score; bestIntent = item.intent; }
            });
        });
        return highestScore > 0.25 ? bestIntent : null;
    }

    async processMessage(message, role = 'customer') {
        if (!this.isTrained) await this.init();

        // Primary LLM Engine (Gemini)
        if (this.genAI && this.apiKey) {
            try {
                const inventory = await this.getInventoryContext();
                const systemPrompt = `You are PharmaTrack Specialist, a professional pharmacist and operational assistant.
                STORE INVENTORY: ${inventory}
                RULES:
                - Assist based on the provided inventory.
                - For symptoms, provide pharmacist-grade advice.
                - DO NOT mention you are an AI, language model, or virtual assistant.
                - DO NOT start responses with "As an AI..." or "As a pharmacist assistant...".
                - Categorize your response into: [Analgesics, Antipyretics, Antacids, Gastrointestinal, Antihistamine, Antitussive, Info, General].
                - OUTPUT FORMAT: Return ONLY valid JSON: {"text": "...", "category": "..."}`;

                // Quota-Resilient Fallback Loop
                const modelNames = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];
                let result;
                let success = false;

                for (const modelName of modelNames) {
                    try {
                        const model = this.genAI.getGenerativeModel({
                            model: modelName,
                            systemInstruction: systemPrompt
                        });
                        result = await model.generateContent(message);
                        success = true;
                        break;
                    } catch (err) {
                        const errMsg = err.message || "";
                        if (errMsg.includes("404") || errMsg.includes("not found")) {
                            continue;
                        } else if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("limit")) {
                            continue;
                        } else {
                            throw err;
                        }
                    }
                }

                if (!success) throw new Error("No compatible Gemini models found.");

                const response = await result.response;
                const aiText = response.text();
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiText);

                return {
                    text: parsed.text,
                    intent: "llm_reasoning",
                    category: parsed.category || "General"
                };
            } catch (err) {
                console.error("Gemini API Fallback Triggered.");
            }
        }

        // --- GROQ Fallback ---
        if (this.groqClient) {
            try {
                const inventory = await this.getInventoryContext();
                const groqMessages = [
                    {
                        role: "system",
                        content: `You are PharmaTrack Specialist, a professional pharmacist assistant.
STORE INVENTORY: ${inventory}
RULES:
- For symptoms, provide professional pharmacist-grade advice.
- DO NOT mention you are an AI or virtual assistant.
- DO NOT start responses with "As an AI..." or "As a pharmacist assistant...".
- Categorize response into: [Analgesics, Antipyretics, Antacids, Gastrointestinal, Antihistamine, Antitussive, Info, General].
- OUTPUT FORMAT: Return ONLY valid JSON: {"text": "...", "category": "..."}`
                    },
                    { role: "user", content: message }
                ];
                const completion = await this.groqClient.chat.completions.create({
                    messages: groqMessages,
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.4,
                    max_tokens: 400,
                    response_format: { type: "json_object" }
                });
                const raw = completion.choices[0]?.message?.content || "{}";
                const parsed = JSON.parse(raw);
                return {
                    text: parsed.text || "Please consult our pharmacist for further guidance.",
                    intent: "llm_reasoning",
                    category: parsed.category || "General"
                };
            } catch (groqErr) {
                // Fallback error handling
            }
        }

        // ─── FALLBACK 3: LOCAL NLP ENGINE ────────────────────────────────────────
        const classifier = role === 'admin' ? this.adminClassifier : this.customerClassifier;
        const knowledge = role === 'admin' ? this.adminKnowledge : this.medicalKnowledge;

        let intent = classifier.classify(message);
        const classifications = classifier.getClassifications(message);
        const confidence = classifications[0]?.value || 0;

        // Strict validation: If confidence is low, we check fuzzy match. 
        // If fuzzy match also fails, we reject it as "unknown".
        if (confidence < 0.8 || message.includes('+')) {
            const fuzzyIntent = this.findBestLocalMatch(message, knowledge);
            if (fuzzyIntent) {
                intent = fuzzyIntent;
            } else if (confidence < 0.5) {
                intent = null; // Force unknown
            }
        }

        const match = knowledge.find(item => item.intent === intent);
        if (!match || (intent === null)) {
            return {
                text: role === 'admin'
                    ? "I'm listening, Manager. I didn't quite catch the specific operational detail you're after—could you clarify if it's about a particular sale, medicine, or stock report?"
                    : "I'm here for you and I want to provide the best guidance possible. Could you describe your feeling or symptoms in a bit more detail? Knowing how long you've felt this way or any other details will help me give you a better recommendation.",
                intent: "unknown"
            };
        }

        return {
            text: match.responses[Math.floor(Math.random() * match.responses.length)],
            intent: match.intent,
            category: match.category
        };
    }
}

module.exports = new AIService();
