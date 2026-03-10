const pool = require("../config/db");

exports.getSuppliers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.*,
                COUNT(p.purchase_id) as total_orders,
                COALESCE(SUM(p.total_amount), 0) as total_spent,
                MAX(p.purchase_date) as last_order_date
            FROM suppliers s
            LEFT JOIN purchases p ON s.supplier_id = p.supplier_id
            GROUP BY s.supplier_id
            ORDER BY s.is_active DESC, s.supplier_name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("GET SUPPLIERS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.toggleSupplierStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE suppliers SET is_active = NOT is_active WHERE supplier_id = $1 RETURNING is_active",
            [id]
        );
        res.json({ message: "Status updated", is_active: result.rows[0].is_active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const { supplier_name, phone, email, address } = req.body;
        const result = await pool.query(
            `INSERT INTO suppliers (supplier_name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [supplier_name, phone, email, address]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { supplier_name, phone, email, address } = req.body;
        await pool.query(
            `UPDATE suppliers 
       SET supplier_name = $1, phone = $2, email = $3, address = $4
       WHERE supplier_id = $5`,
            [supplier_name, phone, email, address, id]
        );
        res.json({ message: "Supplier updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM suppliers WHERE supplier_id = $1", [id]);
        res.json({ message: "Supplier deleted" });
    } catch (err) {
        res.status(500).json({ error: "Cannot delete supplier. It might be linked to purchases." });
    }
};
