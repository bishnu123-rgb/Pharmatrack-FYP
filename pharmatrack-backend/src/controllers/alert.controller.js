const pool = require("../config/db");

exports.generateAlerts = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Identify valid alerts first
    const lowStockBatches = await client.query(`
      SELECT i.batch_id FROM inventory i WHERE i.current_quantity <= i.low_stock_threshold
    `);
    const expiryBatches = await client.query(`
      SELECT batch_id FROM batches WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    `);

    const validBatchIds = [
      ...lowStockBatches.rows.map(r => r.batch_id),
      ...expiryBatches.rows.map(r => r.batch_id)
    ];

    // 2. Remove alerts that are no longer valid (e.g. stock refilled)
    if (validBatchIds.length > 0) {
      await client.query(`
        DELETE FROM alerts WHERE batch_id NOT IN (${validBatchIds.join(",")})
      `);
    } else {
      await client.query("DELETE FROM alerts");
    }

    // 3. Insert/Update Low stock alerts
    await client.query(`
      INSERT INTO alerts (batch_id, alert_type, message)
      SELECT
        i.batch_id,
        'LOW_STOCK',
        'Stock is running low (' || i.current_quantity || ' left)'
      FROM inventory i
      WHERE i.current_quantity <= i.low_stock_threshold
      ON CONFLICT (batch_id, alert_type) DO UPDATE 
      SET message = EXCLUDED.message;
    `);

    // 4. Insert/Update Expiry alerts
    await client.query(`
      INSERT INTO alerts (batch_id, alert_type, message)
      SELECT
        batch_id,
        'EXPIRY',
        CASE
          WHEN expiry_date < CURRENT_DATE THEN 'CRITICAL: This batch has EXPIRED (' || TO_CHAR(expiry_date, 'Mon DD, YYYY') || ')'
          ELSE 'This batch will expire soon (' || TO_CHAR(expiry_date, 'Mon DD, YYYY') || ')'
        END
      FROM batches
      WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      ON CONFLICT (batch_id, alert_type) DO UPDATE
      SET message = EXCLUDED.message;
    `);

    await client.query("COMMIT");

    res.status(200).json({
      message: "System scan complete. Alerts updated."
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, b.batch_number, m.medicine_name, b.expiry_date, m.medicine_id
      FROM alerts a
      JOIN batches b ON a.batch_id = b.batch_id
      JOIN medicines m ON b.medicine_id = m.medicine_id
      ORDER BY a.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
