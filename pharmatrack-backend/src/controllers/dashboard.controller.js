const pool = require("../config/db");

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalMedicines = await pool.query(
      "SELECT COUNT(*) FROM medicines WHERE is_active = TRUE"
    );

    const lowStock = await pool.query(
      `SELECT COUNT(*) FROM inventory i
       JOIN batches b ON i.batch_id = b.batch_id
       JOIN medicines m ON b.medicine_id = m.medicine_id
       WHERE i.current_quantity <= i.low_stock_threshold
       AND m.is_active = TRUE`
    );

    const expiredBatches = await pool.query(
      "SELECT COUNT(*) FROM batches WHERE expiry_date < CURRENT_DATE"
    );

    const todaySales = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE DATE(sale_date) = CURRENT_DATE
    `);

    // --- NEW: Weekly Sales Trend ---
    const weeklySales = await pool.query(`
      SELECT 
        TO_CHAR(d.date, 'Day') as day_name,
        d.date::date as sale_date,
        COALESCE(SUM(s.total_amount), 0) as total
      FROM (
        SELECT CURRENT_DATE - i as date
        FROM generate_series(0, 6) i
      ) d
      LEFT JOIN sales s ON DATE(s.sale_date) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    // --- NEW: Fast Moving Items (Burn Rate Proxy) ---
    const fastMoving = await pool.query(`
      SELECT 
        m.medicine_name as name,
        SUM(si.quantity) as sold_qty
      FROM sale_items si
      JOIN batches b ON si.batch_id = b.batch_id
      JOIN medicines m ON b.medicine_id = m.medicine_id
      JOIN sales s ON si.sale_id = s.sale_id
      WHERE s.sale_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY m.medicine_id, m.medicine_name
      ORDER BY sold_qty DESC
      LIMIT 3
    `);

    // --- NEW: Unified Recent Activity Feed ---
    const recentActivity = await pool.query(`
      (SELECT 
        'SALE' as type, 
        customer_name as detail, 
        total_amount::float as amount, 
        sale_date as date 
       FROM sales 
       ORDER BY sale_date DESC LIMIT 5)
      UNION ALL
      (SELECT 
        'PURCHASE' as type, 
        supplier_name as detail, 
        total_amount::float as amount, 
        purchase_date as date 
       FROM purchases p
       JOIN suppliers sup ON p.supplier_id = sup.supplier_id
       ORDER BY purchase_date DESC LIMIT 5)
      ORDER BY date DESC
      LIMIT 5
    `);

    res.status(200).json({
      total_medicines: Number(totalMedicines.rows[0].count),
      low_stock_items: Number(lowStock.rows[0].count),
      expired_batches: Number(expiredBatches.rows[0].count),
      today_sales: Number(todaySales.rows[0].total),
      weekly_sales: weeklySales.rows.map(row => ({
        day: row.day_name.trim(),
        total: Number(row.total)
      })),
      fast_moving: fastMoving.rows.map(row => ({
        name: row.name,
        sold: Number(row.sold_qty)
      })),
      activities: recentActivity.rows
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
