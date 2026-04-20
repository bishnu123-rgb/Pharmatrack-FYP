const aiService = require('../services/ai.service');
const pool = require('../config/db');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require('groq-sdk');

exports.chat = async (req, res) => {
    try {
        const { message, role } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const result = await aiService.processMessage(message, role || 'customer');

        let suggestedMedicines = [];

        // If high confidence symptom intent, fetch related items from DB
        if (result.category && result.category !== 'General' && result.category !== 'Info') {
            const medQuery = `
                SELECT m.medicine_id, m.medicine_name as name, c.category_name, m.dosage_form, m.strength, m.image_url 
                FROM medicines m
                JOIN categories c ON m.category_id = c.category_id
                WHERE c.category_name ILIKE $1 AND m.is_active = TRUE
                LIMIT 3
            `;
            const meds = await pool.query(medQuery, [`%${result.category}%`]);
            suggestedMedicines = meds.rows;
        }

        res.json({
            reply: result.text,
            intent: result.intent,
            category: result.category,
            suggestions: suggestedMedicines
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Drug interaction checker — uses its own clinical system prompt, separate from the chatbot.
exports.checkInteraction = async (req, res) => {
    try {
        const { drug1, drug2 } = req.body;
        if (!drug1 || !drug2) {
            return res.status(400).json({ error: 'Two drug names are required.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'your_key_here') {
            const genAI = new GoogleGenerativeAI(apiKey.trim());

            const systemInstruction = `You are a strict clinical pharmacology module. Your ONLY job is drug-drug interaction analysis.
RULES (non-negotiable):
1. If EITHER input is not a real drug/medication, respond with EXACTLY: {"valid": false, "reason": "NOT_A_DRUG"}
2. If both are real drugs, respond with EXACTLY this JSON: {"valid": true, "score": <number 0-100>, "status": "<Safe|Caution|Warning>", "analysis": "<professional 2-3 sentence clinical summary>"}
3. Score 76-100 = Safe, 51-75 = Caution, 0-50 = Warning.
4. Do NOT greet. Do NOT ask questions. Do NOT add markdown. Return ONLY the JSON object.`;

            const modelNames = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];

            let parsed = null;

            for (const modelName of modelNames) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
                    const result = await model.generateContent(`Drug interaction check: "${drug1}" + "${drug2}"`);
                    const text = result.response.text();
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
                    break;
                } catch (err) {
                    if (err.message?.includes("404") || err.message?.includes("429") || err.message?.includes("quota")) continue;
                    break;
                }
            }

            if (parsed) {
                if (!parsed.valid) {
                    return res.json({ valid: false, score: 0, status: "Invalid", analysis: `"${drug1}" and/or "${drug2}" do not appear to be valid medication names. Please provide real drug names (e.g., Aspirin, Metformin).` });
                }
                return res.json({ valid: true, score: parsed.score, status: parsed.status, analysis: parsed.analysis });
            }
        }

        // Fallback: Try Groq if Gemini is unavailable
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey && groqKey !== 'your_groq_key_here') {
            try {
                const groq = new Groq({ apiKey: groqKey.trim() });
                const systemPrompt = `You are a strict clinical pharmacology module. Your ONLY job is drug-drug interaction analysis.
RULES (non-negotiable):
1. If EITHER input is not a real drug/medication, respond with EXACTLY: {"valid": false}
2. If both are real drugs, respond with EXACTLY this JSON: {"valid": true, "score": <number 0-100>, "status": "<Safe|Caution|Warning>", "analysis": "<professional 2-3 sentence clinical summary>"}
3. Score 76-100 = Safe, 51-75 = Caution, 0-50 = Warning.
4. Do NOT greet. Do NOT ask questions. Return ONLY the JSON object.`;

                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Drug interaction check: "${drug1}" + "${drug2}"` }
                    ],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.2,
                    max_tokens: 300,
                    response_format: { type: "json_object" }
                });
                const raw = completion.choices[0]?.message?.content || "{}";
                const parsed = JSON.parse(raw);

                if (!parsed.valid) {
                    return res.json({ valid: false, score: 0, status: "Invalid", analysis: `"${drug1}" and/or "${drug2}" do not appear to be valid medication names. Please provide real drug names (e.g., Aspirin, Metformin).` });
                }
                return res.json({ valid: true, score: parsed.score, status: parsed.status, analysis: parsed.analysis });
            } catch (groqErr) {
                // Fallback to local logic
            }
        }

        // Final fallback: validate against local known-drug list
        const KNOWN_DRUGS = new Set([
            "aspirin", "paracetamol", "acetaminophen", "ibuprofen", "naproxen",
            "warfarin", "metformin", "atorvastatin", "simvastatin", "omeprazole",
            "amoxicillin", "ciprofloxacin", "metronidazole", "azithromycin",
            "amlodipine", "lisinopril", "losartan", "atenolol", "metoprolol",
            "fluoxetine", "sertraline", "diazepam", "lorazepam", "codeine",
            "morphine", "tramadol", "cetirizine", "loratadine", "pantoprazole",
            "ranitidine", "dexamethasone", "prednisolone", "insulin", "glibenclamide",
            "salbutamol", "montelukast", "clopidogrel", "digoxin", "furosemide",
            "hydrochlorothiazide", "spironolactone", "sildenafil", "tadalafil",
            "chloroquine", "hydroxychloroquine", "doxycycline", "rifampicin",
            "isoniazid", "ethambutol", "pyrazinamide", "fluconazole", "itraconazole",
            "acyclovir", "oseltamivir", "levothyroxine", "carbimazole", "phenytoin",
            "carbamazepine", "sodium valproate", "levetiracetam", "gabapentin",
            "flexon", "brufen", "combiflam", "crocin", "dolo", "augmentin",
            "clindamycin", "erythromycin", "levofloxacin", "norfloxacin",
            "cefixime", "ceftriaxone", "amikacin", "gentamicin"
        ]);

        const d1Lower = drug1.trim().toLowerCase();
        const d2Lower = drug2.trim().toLowerCase();
        const d1Valid = KNOWN_DRUGS.has(d1Lower) || d1Lower.length > 5;
        const d2Valid = KNOWN_DRUGS.has(d2Lower) || d2Lower.length > 5;

        if (!d1Valid || !d2Valid) {
            return res.json({ valid: false, score: 0, status: "Invalid", analysis: `"${drug1}" and/or "${drug2}" do not appear to be valid medication names. Please provide real drug names (e.g., Aspirin, Metformin).` });
        }

        return res.json({
            valid: true, score: 70, status: "Caution",
            analysis: `A full AI analysis of ${drug1} + ${drug2} is temporarily unavailable (API quota). As a general precaution, always consult a licensed pharmacist before combining medications. Monitor for unusual side effects.`
        });

    } catch (error) {
        res.status(500).json({ error: 'Analysis service temporarily unavailable.' });
    }
};

exports.getInventoryInsights = async (req, res) => {
    try {
        const { stats } = req.body;
        if (!stats) return res.status(400).json({ error: 'Stats are required' });

        const prompt = `
            Task: Pharmacy Operational Analyst.
            Data: Low Stock: ${stats.low_stock_items}, Expired: ${stats.expired_batches}, Fast Moving: ${stats.fast_moving?.map(i => i.name).join(', ') || 'N/A'}. 
            Goal: Provide a 1-2 sentence high-impact strategic tip for the pharmacy manager. 
            Tone: Professional, urgent if needed, and data-driven.
            Constraint: Return only the tip text, no preamble.
        `;

        let tip = "";
        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
            });
            tip = completion.choices[0].message.content;
        } catch (e) {
            tip = "Maintain focus on restocking fast-moving items and clearing expired batches to optimize clinical safety and cash flow.";
        }

        res.json({ tip });
    } catch (error) {
        console.error('Inventory Insight Error:', error);
        res.status(500).json({ error: 'Insight engine temporarily offline.' });
    }
};
