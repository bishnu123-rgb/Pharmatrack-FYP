const pool = require("../config/db");

exports.createBatch = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      batch_number,
      expiry_date,
      cost_price,
      selling_price,
      medicine_id,
      barcode
    } = req.body;

    if (!batch_number || !expiry_date || !cost_price || !selling_price || !medicine_id) {
      return res.status(400).json({ message: "Missing required fields: batch_number, expiry_date, cost_price, selling_price, medicine_id." });
    }

    const costNum = parseFloat(cost_price);
    const sellNum = parseFloat(selling_price);

    if (isNaN(costNum) || costNum < 0) {
      return res.status(400).json({ message: "Cost price must be a non-negative number." });
    }
    if (isNaN(sellNum) || sellNum <= 0) {
      return res.status(400).json({ message: "Selling price must be greater than zero." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiry_date);
    if (expiry <= today) {
      return res.status(400).json({ message: "Expiry date must be a future date." });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO batches
       (batch_number, expiry_date, cost_price, selling_price, medicine_id, barcode)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING batch_id`,
      [batch_number, expiry_date, costNum, sellNum, medicine_id, barcode || null]
    );

    const batchId = result.rows[0].batch_id;

    await client.query(
      "INSERT INTO inventory (batch_id, current_quantity) VALUES ($1, 0)",
      [batchId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Batch created successfully", batch_id: batchId });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === '23505') {
      return res.status(409).json({ message: "A batch with this batch number already exists." });
    }
    res.status(500).json({ message: "Failed to create batch." });
  } finally {
    client.release();
  }
};

exports.getBatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, m.medicine_name, m.image_url, i.current_quantity, 
             m.requires_prescription, m.dosage_form, m.strength, m.category_id,
             COALESCE(c.category_name, 'General') as category_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.medicine_id
      LEFT JOIN categories c ON m.category_id = c.category_id
      LEFT JOIN inventory i ON b.batch_id = i.batch_id
      WHERE b.is_active = TRUE
      ORDER BY b.batch_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch batches." });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      batch_number,
      expiry_date,
      cost_price,
      selling_price,
      barcode
    } = req.body;

    if (!batch_number || !expiry_date || !cost_price || !selling_price) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const costNum = parseFloat(cost_price);
    const sellNum = parseFloat(selling_price);

    if (isNaN(costNum) || costNum < 0) {
      return res.status(400).json({ message: "Cost price must be a non-negative number." });
    }
    if (isNaN(sellNum) || sellNum <= 0) {
      return res.status(400).json({ message: "Selling price must be greater than zero." });
    }

    await pool.query(
      `UPDATE batches 
       SET batch_number = $1, expiry_date = $2, cost_price = $3, selling_price = $4, barcode = $5
       WHERE batch_id = $6`,
      [batch_number, expiry_date, costNum, sellNum, barcode || null, id]
    );

    res.status(200).json({ message: "Batch updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update batch." });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE batches SET is_active = FALSE WHERE batch_id = $1", [id]);
    res.status(200).json({ message: "Batch archived successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to archive batch." });
  }
};
