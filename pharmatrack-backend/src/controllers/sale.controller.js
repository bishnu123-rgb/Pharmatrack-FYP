const pool = require("../config/db");
const { logActivity } = require("../utils/logger");

exports.createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const { items, customer_name, customer_phone } = req.body;
    const userId = req.user.user_id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Invalid sale data" });
    }

    await client.query("BEGIN");

    const saleResult = await client.query(
      `INSERT INTO sales (created_by, customer_name, customer_phone)
       VALUES ($1, $2, $3)
       RETURNING sale_id`,
      [userId, customer_name || 'Walking Customer', customer_phone || null]
    );

    const saleId = saleResult.rows[0].sale_id;
    let totalAmount = 0;

    for (const item of items) {
      const { batch_id, quantity, unit_price } = item;
      const subtotal = quantity * unit_price;
      totalAmount += subtotal;

      const stock = await client.query(
        `SELECT i.current_quantity, b.expiry_date, m.is_active
         FROM inventory i
         JOIN batches b ON i.batch_id = b.batch_id
         JOIN medicines m ON b.medicine_id = m.medicine_id
         WHERE i.batch_id = $1`,
        [batch_id]
      );

      if (stock.rows.length === 0) {
        throw new Error(`Batch ${batch_id} not found in inventory`);
      }

      if (stock.rows[0].is_active === false) {
        throw new Error(`Medicine in batch ${batch_id} is inactive and cannot be sold`);
      }

      if (new Date(stock.rows[0].expiry_date) < new Date()) {
        throw new Error(`Batch ${batch_id} has expired and cannot be sold`);
      }

      if (stock.rows[0].current_quantity < quantity) {
        throw new Error(`Insufficient stock for batch ${batch_id}`);
      }

      await client.query(
        `INSERT INTO sale_items
         (sale_id, batch_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, batch_id, quantity, unit_price, subtotal]
      );

      await client.query(
        `UPDATE inventory
         SET current_quantity = current_quantity - $1
         WHERE batch_id = $2`,
        [quantity, batch_id]
      );
    }

    await client.query(
      `UPDATE sales SET total_amount = $1 WHERE sale_id = $2`,
      [totalAmount, saleId]
    );

    await client.query("COMMIT");

    await logActivity(userId, "SALE", `Sale ${saleId} created`);

    res.status(201).json({
      message: "Sale completed",
      sale_id: saleId,
      total_amount: totalAmount
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getSales = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.username as sold_by_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.user_id
      ORDER BY s.sale_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET SALES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get sale header
    const saleResult = await pool.query(`
      SELECT s.*, u.username as sold_by_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.user_id
      WHERE s.sale_id = $1
    `, [id]);

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Get sale items with medicine details
    const itemsResult = await pool.query(`
      SELECT si.*, b.batch_number, m.medicine_name, m.dosage_form, m.strength
      FROM sale_items si
      JOIN batches b ON si.batch_id = b.batch_id
      JOIN medicines m ON b.medicine_id = m.medicine_id
      WHERE si.sale_id = $1
    `, [id]);

    res.json({
      ...saleResult.rows[0],
      items: itemsResult.rows
    });
  } catch (err) {
    console.error("GET SALE BY ID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const statsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as daily_revenue,
        COUNT(*) as transaction_count,
        COALESCE((
          SELECT m.medicine_name 
          FROM sale_items si
          JOIN batches b ON si.batch_id = b.batch_id
          JOIN medicines m ON b.medicine_id = m.medicine_id
          GROUP BY m.medicine_name
          ORDER BY SUM(si.quantity) DESC
          LIMIT 1
        ), 'None') as top_medicine
      FROM sales 
      WHERE sale_date::date = $1
    `, [today]);

    res.json(statsResult.rows[0]);
  } catch (err) {
    console.error("GET SALES STATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
