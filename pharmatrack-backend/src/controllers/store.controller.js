const pool = require("../config/db");

// Ensure stock_requests table exists on first use
const ensureStockRequestsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS stock_requests (
            id SERIAL PRIMARY KEY,
            medicine_id INT REFERENCES medicines(medicine_id) ON DELETE CASCADE,
            customer_name VARCHAR(100) NOT NULL,
            customer_phone VARCHAR(20) NOT NULL,
            requested_at TIMESTAMP DEFAULT NOW(),
            fulfilled BOOLEAN DEFAULT FALSE
        )
    `);
};

// Public: Customer requests notification when out-of-stock medicine is restocked
exports.requestStockNotification = async (req, res) => {
    try {
        await ensureStockRequestsTable();
        const { medicine_id, customer_name, customer_phone } = req.body;
        if (!medicine_id || !customer_name || !customer_phone) {
            return res.status(400).json({ error: "Name, phone and medicine are required." });
        }
        // Prevent duplicate requests from same phone for same medicine
        const existing = await pool.query(
            "SELECT id FROM stock_requests WHERE medicine_id=$1 AND customer_phone=$2 AND fulfilled=FALSE",
            [medicine_id, customer_phone]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "You already have a notification request for this medicine." });
        }
        await pool.query(
            "INSERT INTO stock_requests (medicine_id, customer_name, customer_phone) VALUES ($1, $2, $3)",
            [medicine_id, customer_name, customer_phone]
        );
        res.status(201).json({ message: "Notification request saved. We'll contact you when this medicine is back in stock!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Public: Get all active medicines with real-time stock availability
exports.getPublicMedicines = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.medicine_id,
                m.medicine_name AS name,
                m.dosage_form,
                m.strength,
                m.manufacturer,
                m.image_url,
                m.description,
                m.requires_prescription,
                COALESCE(c.category_name, 'General') AS category_name,
                c.category_id,
                COALESCE(SUM(i.current_quantity), 0) AS total_stock,

                COALESCE(MAX(i.low_stock_threshold), 10) AS low_stock_threshold
            FROM medicines m
            LEFT JOIN categories c ON m.category_id = c.category_id
            LEFT JOIN batches b ON b.medicine_id = m.medicine_id AND b.expiry_date >= CURRENT_DATE
            LEFT JOIN inventory i ON i.batch_id = b.batch_id
            WHERE m.is_active = TRUE
            GROUP BY m.medicine_id, m.medicine_name, m.dosage_form, m.strength,
                     m.manufacturer, m.image_url, m.description, m.requires_prescription,
                     c.category_name, c.category_id
            ORDER BY m.medicine_name ASC
        `);

        const medicines = result.rows.map(med => {
            const stock = Number(med.total_stock);
            const threshold = Number(med.low_stock_threshold);
            let availability = "in_stock";
            if (stock === 0) availability = "out_of_stock";
            else if (stock <= threshold) availability = "low_stock";

            return { ...med, total_stock: stock, availability };
        });

        res.json(medicines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Public: Get a single medicine's full detail
exports.getMedicineDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const medResult = await pool.query(`
            SELECT 
                m.medicine_id,
                m.medicine_name AS name,
                m.dosage_form,
                m.strength,
                m.manufacturer,
                m.image_url,
                m.description,
                m.indications,
                m.side_effects,
                m.requires_prescription,
                COALESCE(c.category_name, 'General') AS category_name,
                c.category_id,
                COALESCE(SUM(i.current_quantity), 0) AS total_stock,

                COALESCE(MAX(i.low_stock_threshold), 10) AS low_stock_threshold,
                MIN(b.expiry_date) AS earliest_expiry
            FROM medicines m
            LEFT JOIN categories c ON m.category_id = c.category_id
            LEFT JOIN batches b ON b.medicine_id = m.medicine_id AND b.expiry_date >= CURRENT_DATE
            LEFT JOIN inventory i ON i.batch_id = b.batch_id
            WHERE m.medicine_id = $1 AND m.is_active = TRUE
            GROUP BY m.medicine_id, m.medicine_name, m.dosage_form, m.strength,
                     m.manufacturer, m.image_url, m.description, m.indications,
                     m.side_effects, m.requires_prescription, c.category_name, c.category_id
        `, [id]);

        if (medResult.rows.length === 0) {
            return res.status(404).json({ error: "Medicine not found." });
        }

        const med = medResult.rows[0];
        const stock = Number(med.total_stock);
        const threshold = Number(med.low_stock_threshold);
        let availability = "in_stock";
        if (stock === 0) availability = "out_of_stock";
        else if (stock <= threshold) availability = "low_stock";

        // Related medicines (same category, excluding self)
        const relatedResult = await pool.query(`
            SELECT m.medicine_id, m.medicine_name AS name, m.dosage_form, m.strength, m.image_url,
                   COALESCE(SUM(i.current_quantity), 0) AS total_stock
            FROM medicines m
            LEFT JOIN batches b ON b.medicine_id = m.medicine_id AND b.expiry_date >= CURRENT_DATE
            LEFT JOIN inventory i ON i.batch_id = b.batch_id
            WHERE m.category_id = $1 AND m.medicine_id != $2 AND m.is_active = TRUE
            GROUP BY m.medicine_id, m.medicine_name, m.dosage_form, m.strength, m.image_url
            ORDER BY m.medicine_name ASC
            LIMIT 4
        `, [med.category_id, id]);

        res.json({
            ...med,
            total_stock: stock,
            availability,
            related: relatedResult.rows.map(r => ({ ...r, total_stock: Number(r.total_stock) }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin: Get all unfulfilled stock requests with medicine names and current availability
exports.getAllStockRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                sr.*, 
                m.medicine_name, 
                m.dosage_form, 
                m.strength,
                COALESCE(inv.total_qty, 0) as current_stock
            FROM stock_requests sr
            JOIN medicines m ON sr.medicine_id = m.medicine_id
            LEFT JOIN (
                SELECT b.medicine_id, SUM(i.current_quantity) as total_qty
                FROM batches b
                JOIN inventory i ON b.batch_id = i.batch_id
                WHERE b.expiry_date >= CURRENT_DATE
                GROUP BY b.medicine_id
            ) inv ON sr.medicine_id = inv.medicine_id
            WHERE sr.fulfilled = FALSE
            ORDER BY sr.requested_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Admin: Mark a request as fulfilled
exports.fulfillStockRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            "UPDATE stock_requests SET fulfilled = TRUE WHERE id = $1",
            [id]
        );
        res.json({ message: "Stock request marked as fulfilled." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Public: Get all categories (for filter bar)
exports.getPublicCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.category_id, c.category_name, COUNT(m.medicine_id)::int AS medicine_count
            FROM categories c
            LEFT JOIN medicines m ON m.category_id = c.category_id AND m.is_active = TRUE
            GROUP BY c.category_id, c.category_name
            ORDER BY medicine_count DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


