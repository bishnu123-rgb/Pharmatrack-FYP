const pool = require("../config/db");

exports.getDashboardSummary = async (req, res) => {
  try {
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin';

    // Basic operational metrics (All Roles)
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
      `SELECT COUNT(*) FROM batches b
       JOIN medicines m ON b.medicine_id = m.medicine_id
       WHERE b.expiry_date < CURRENT_DATE 
       AND b.is_active = TRUE 
       AND m.is_active = TRUE`
    );

    // Notification-specific metrics (Unread count)
    const unreadAlertsCount = await pool.query(
      "SELECT COUNT(*) FROM alerts WHERE is_read = FALSE"
    );


    const todaySales = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE DATE(sale_date) = CURRENT_DATE
    `);

    // --- Conditional Profit Metrics (Admin Only) ---
    let today_profit = null;
    let weeklyTrendRes = null;

    if (isAdmin) {
      const todayProfitRes = await pool.query(`
        SELECT COALESCE(SUM((si.unit_price - b.cost_price) * si.quantity), 0) as profit
        FROM sale_items si
        JOIN batches b ON si.batch_id = b.batch_id
        JOIN sales s ON si.sale_id = s.sale_id
        WHERE DATE(s.sale_date) = CURRENT_DATE
      `);
      today_profit = Number(todayProfitRes.rows[0].profit);

      weeklyTrendRes = await pool.query(`
        SELECT 
          TO_CHAR(d.date, 'Day') as day_name,
          d.date::date as tr_date,
          COALESCE(SUM(s.total_amount), 0) as total_sales,
          COALESCE(SUM((si.unit_price - b.cost_price) * si.quantity), 0) as total_profit
        FROM (
          SELECT CURRENT_DATE - i as date
          FROM generate_series(0, 6) i
        ) d
        LEFT JOIN sales s ON DATE(s.sale_date) = d.date
        LEFT JOIN sale_items si ON s.sale_id = si.sale_id
        LEFT JOIN batches b ON si.batch_id = b.batch_id
        GROUP BY d.date
        ORDER BY d.date ASC
      `);
    } else {
      // Non-admin version of weekly sales (no cost/profit join)
      weeklyTrendRes = await pool.query(`
        SELECT 
          TO_CHAR(d.date, 'Day') as day_name,
          COALESCE(SUM(s.total_amount), 0) as total_sales
        FROM (
          SELECT CURRENT_DATE - i as date
          FROM generate_series(0, 6) i
        ) d
        LEFT JOIN sales s ON DATE(s.sale_date) = d.date
        GROUP BY d.date
        ORDER BY d.date ASC
      `);
    }

    // --- Fast Moving Items ---
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

    // --- Activity Feed ---
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

    // --- Stock Requests (Notify Me) ---
    const stockRequests = await pool.query(
      "SELECT COUNT(*) FROM stock_requests WHERE fulfilled = FALSE"
    );

    const readyLeadsRes = await pool.query(`
      SELECT COUNT(*) 
      FROM stock_requests sr
      JOIN (
          SELECT b.medicine_id, SUM(i.current_quantity) as total_qty
          FROM batches b
          JOIN inventory i ON b.batch_id = i.batch_id
          WHERE b.expiry_date >= CURRENT_DATE
          GROUP BY b.medicine_id
      ) inv ON sr.medicine_id = inv.medicine_id
      WHERE sr.fulfilled = FALSE AND inv.total_qty > 0
    `);


    res.status(200).json({
      total_medicines: Number(totalMedicines.rows[0].count),
      low_stock_items: Number(lowStock.rows[0].count),
      expired_batches: Number(expiredBatches.rows[0].count),
      unread_alerts: Number(unreadAlertsCount.rows[0].count),
      today_sales: Number(todaySales.rows[0].total),
      today_profit: today_profit,
      stock_requests: Number(stockRequests.rows[0].count),
      ready_leads: Number(readyLeadsRes.rows[0].count),
      weekly_sales: weeklyTrendRes.rows.map(row => ({

        day: row.day_name.trim(),
        total: Number(row.total_sales),
        profit: isAdmin ? Number(row.total_profit || 0) : null
      })),
      fast_moving: fastMoving.rows.map(row => ({
        name: row.name,
        sold: Number(row.sold_qty)
      })),
      activities: recentActivity.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
