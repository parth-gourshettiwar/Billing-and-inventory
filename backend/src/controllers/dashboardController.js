const { query } = require('../config/database');

const getDashboard = async (req, res, next) => {
  try {
    const settings = await query('SELECT low_stock_threshold FROM settings WHERE id = 1');
    const threshold = settings.rows[0]?.low_stock_threshold || 10;

    const [todaySales, monthlySales, totalRevenue, productStats, monthlyChart, topProducts, recentBills, recentMovements] = await Promise.all([
      // Today's sales
      query(`SELECT COUNT(*) AS bills, COALESCE(SUM(grand_total), 0) AS sales FROM bills 
             WHERE DATE(created_at) = CURRENT_DATE AND status = 'Active'`),
      // Monthly sales
      query(`SELECT COUNT(*) AS bills, COALESCE(SUM(grand_total), 0) AS sales,
                    COALESCE(SUM(grand_total - cgst_total - sgst_total), 0) AS taxable
             FROM bills 
             WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
               AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
               AND status = 'Active'`),
      // Total revenue
      query(`SELECT COALESCE(SUM(grand_total), 0) AS total_revenue,
                    COALESCE(SUM(grand_total) - SUM(b_items.total_cost), 0) AS total_profit
             FROM bills
             LEFT JOIN (
               SELECT bill_id, SUM(purchase_price * quantity) AS total_cost FROM bill_items GROUP BY bill_id
             ) b_items ON b_items.bill_id = bills.id
             WHERE bills.status = 'Active'`),
      // Product stats
      query(`SELECT 
               COUNT(*) FILTER (WHERE status = 'Active') AS active_products,
               COUNT(*) FILTER (WHERE stock <= $1 AND stock > 0 AND status = 'Active') AS low_stock,
               COUNT(*) FILTER (WHERE stock = 0) AS out_of_stock
             FROM products`, [threshold]),
      // Last 12 months chart data
      query(`SELECT 
               TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS month,
               EXTRACT(MONTH FROM created_at) AS month_num,
               EXTRACT(YEAR FROM created_at) AS year,
               COALESCE(SUM(grand_total), 0) AS revenue,
               COALESCE(SUM(grand_total) - SUM(cgst_total) - SUM(sgst_total), 0) AS profit
             FROM bills
             WHERE created_at >= CURRENT_DATE - INTERVAL '11 months'
               AND status = 'Active'
             GROUP BY DATE_TRUNC('month', created_at), month_num, year
             ORDER BY year, month_num`),
      // Top selling products
      query(`SELECT p.product_name, SUM(bi.quantity) AS total_qty, SUM(bi.line_total) AS total_revenue
             FROM bill_items bi
             JOIN products p ON p.id = bi.product_id
             JOIN bills b ON b.id = bi.bill_id AND b.status = 'Active'
             WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY p.id, p.product_name
             ORDER BY total_qty DESC
             LIMIT 5`),
      // Recent bills
      query(`SELECT id, invoice_number, customer_name, vehicle_number, grand_total, status, created_at
             FROM bills ORDER BY created_at DESC LIMIT 8`),
      // Recent stock movements
      query(`SELECT sm.*, p.product_name FROM stock_movements sm
             JOIN products p ON p.id = sm.product_id
             ORDER BY sm.created_at DESC LIMIT 6`),
    ]);

    res.json({
      success: true,
      data: {
        today: { bills: parseInt(todaySales.rows[0].bills), sales: parseFloat(todaySales.rows[0].sales) },
        monthly: { bills: parseInt(monthlySales.rows[0].bills), sales: parseFloat(monthlySales.rows[0].sales) },
        totals: { revenue: parseFloat(totalRevenue.rows[0].total_revenue), profit: parseFloat(totalRevenue.rows[0].total_profit) },
        products: { active: parseInt(productStats.rows[0].active_products), low: parseInt(productStats.rows[0].low_stock), outOfStock: parseInt(productStats.rows[0].out_of_stock) },
        chart: monthlyChart.rows,
        topProducts: topProducts.rows,
        recentBills: recentBills.rows,
        recentMovements: recentMovements.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
