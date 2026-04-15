const pool = require("../config/db");
const { logActivity } = require("../utils/logger");

exports.createPurchase = async (req, res) => {
  const client = await pool.connect();

  try {
    const { supplier_id, invoice_no, items } = req.body;
    const userId = req.user.user_id;

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid purchase data" });
    }

    const supplierCheck = await client.query(
      "SELECT is_active FROM suppliers WHERE supplier_id = $1",
      [supplier_id]
    );

    if (supplierCheck.rows.length === 0 || !supplierCheck.rows[0].is_active) {
      return res.status(403).json({ message: "Supplier is inactive and cannot record purchases" });
    }

    await client.query("BEGIN");

    const purchaseResult = await client.query(
      `INSERT INTO purchases (supplier_id, invoice_no, total_amount, created_by)
       VALUES ($1, $2, 0, $3)
       RETURNING purchase_id`,
      [supplier_id, invoice_no, userId]
    );

    const purchaseId = purchaseResult.rows[0].purchase_id;
    let totalAmount = 0;

    for (const item of items) {
      const { quantity, unit_cost } = item;
      const subtotal = quantity * unit_cost;
      totalAmount += subtotal;

      let batchId = item.batch_id;

      // NEW BATCH MODE: create batch + inventory row first
      if (!batchId && item.medicine_id) {
        const { medicine_id, batch_number, expiry_date, selling_price } = item;

        const newBatch = await client.query(
          `INSERT INTO batches (medicine_id, batch_number, expiry_date, cost_price, selling_price)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING batch_id`,
          [medicine_id, batch_number, expiry_date, unit_cost, selling_price || (unit_cost * 1.3)]
        );

        batchId = newBatch.rows[0].batch_id;

        // Create inventory record for the new batch
        await client.query(
          `INSERT INTO inventory (batch_id, current_quantity, low_stock_threshold)
           VALUES ($1, $2, 10)`,
          [batchId, quantity]
        );
      } else {
        // RESTOCK MODE: update existing inventory
        await client.query(
          `UPDATE inventory
           SET current_quantity = current_quantity + $1
           WHERE batch_id = $2`,
          [quantity, batchId]
        );
      }

      await client.query(
        `INSERT INTO purchase_items
         (purchase_id, batch_id, quantity, unit_cost, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchaseId, batchId, quantity, unit_cost, subtotal]
      );
    }

    await client.query(
      `UPDATE purchases SET total_amount = $1 WHERE purchase_id = $2`,
      [totalAmount, purchaseId]
    );

    await client.query("COMMIT");

    await logActivity(userId, "PURCHASE", `Purchase ${purchaseId} created — ${items.length} item(s), NPR ${totalAmount}`);

    res.status(201).json({
      message: "Purchase recorded successfully",
      purchase_id: purchaseId,
      total_amount: totalAmount
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Purchase creation error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.purchase_id,
        p.invoice_no,
        p.purchase_date,
        p.total_amount,
        s.supplier_name,
        u.username as created_by,
        COUNT(pi.purchase_item_id) as item_count
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
      GROUP BY p.purchase_id, s.supplier_name, u.username
      ORDER BY p.purchase_date DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        p.purchase_id, p.invoice_no, p.purchase_date, p.total_amount,
        s.supplier_name, s.phone as supplier_phone,
        u.username as created_by
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.purchase_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const purchase = result.rows[0];

    const itemsResult = await pool.query(`
      SELECT 
        pi.quantity, pi.unit_cost, pi.subtotal,
        b.batch_number,
        m.medicine_name, m.dosage_form, m.strength
      FROM purchase_items pi
      JOIN batches b ON pi.batch_id = b.batch_id
      JOIN medicines m ON b.medicine_id = m.medicine_id
      WHERE pi.purchase_id = $1
    `, [id]);

    purchase.items = itemsResult.rows;

    res.json(purchase);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
