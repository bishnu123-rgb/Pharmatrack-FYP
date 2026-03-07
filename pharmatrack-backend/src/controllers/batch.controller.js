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

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO batches
       (batch_number, expiry_date, cost_price, selling_price, medicine_id, barcode)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING batch_id`,
      [batch_number, expiry_date, cost_price, selling_price, medicine_id, barcode]
    );

    const batchId = result.rows[0].batch_id;

    // Initialize inventory for this batch
    await client.query(
      "INSERT INTO inventory (batch_id, current_quantity) VALUES ($1, 0)",
      [batchId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Batch created successfully", batch_id: batchId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("CREATE BATCH ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getBatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, m.medicine_name, i.current_quantity
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.medicine_id
      LEFT JOIN inventory i ON b.batch_id = i.batch_id
      ORDER BY b.batch_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    await pool.query(
      `UPDATE batches 
       SET batch_number = $1, expiry_date = $2, cost_price = $3, selling_price = $4, barcode = $5
       WHERE batch_id = $6`,
      [batch_number, expiry_date, cost_price, selling_price, barcode, id]
    );

    res.status(200).json({ message: "Batch updated successfully" });
  } catch (err) {
    console.error("UPDATE BATCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    // Note: inventory should probably be deleted too, but database might have cascades or constraints
    await pool.query("DELETE FROM batches WHERE batch_id = $1", [id]);
    res.status(200).json({ message: "Batch deleted successfully" });
  } catch (err) {
    console.error("DELETE BATCH ERROR:", err);
    res.status(500).json({ error: "Cannot delete batch. It might have transactions." });
  }
};
