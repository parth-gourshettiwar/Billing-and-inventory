const { query } = require('../config/database');

const getReports = async (req, res, next) => {
  try {
    const { type = 'monthly', startDate, endDate } = req.query;
    let groupBy, dateLabel, dateFilter;

    const now = new Date();
    let start = startDate;
    let end = endDate;

    if (!start || !end) {
      if (type === 'daily') {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
      } else if (type === 'monthly') {
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
      } else {
        start = new Date(now.getFullYear() - 3, 0, 1).toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
      }
    }

    if (type === 'daily') {
      groupBy = `DATE(b.created_at)`;
      dateLabel = `TO_CHAR(DATE(b.created_at), 'DD Mon YYYY')`;
    } else if (type === 'monthly') {
      groupBy = `DATE_TRUNC('month', b.created_at)`;
      dateLabel = `TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY')`;
    } else {
      groupBy = `DATE_TRUNC('year', b.created_at)`;
      dateLabel = `TO_CHAR(DATE_TRUNC('year', b.created_at), 'YYYY')`;
    }

    const [salesData, gstData, profitData] = await Promise.all([
      query(`SELECT ${dateLabel} AS period, COUNT(b.id) AS bills,
                    COALESCE(SUM(b.grand_total), 0) AS revenue,
                    COALESCE(SUM(b.taxable_total), 0) AS taxable_total,
                    COALESCE(SUM(b.cgst_total), 0) AS cgst,
                    COALESCE(SUM(b.sgst_total), 0) AS sgst
             FROM bills b
             WHERE b.status = 'Active' AND DATE(b.created_at) BETWEEN $1 AND $2
             GROUP BY ${groupBy} ORDER BY ${groupBy}`,
        [start, end]),
      query(`SELECT bi.gst_rate, ${dateLabel} AS period,
                    COALESCE(SUM(bi.taxable_value), 0) AS taxable_value,
                    COALESCE(SUM(bi.cgst_amount), 0) AS cgst_amount,
                    COALESCE(SUM(bi.sgst_amount), 0) AS sgst_amount
             FROM bill_items bi
             JOIN bills b ON b.id = bi.bill_id AND b.status = 'Active'
             WHERE DATE(b.created_at) BETWEEN $1 AND $2
             GROUP BY bi.gst_rate, ${groupBy} ORDER BY bi.gst_rate, ${groupBy}`,
        [start, end]),
      query(`SELECT ${dateLabel} AS period,
                    COALESCE(SUM(b.grand_total), 0) AS revenue,
                    COALESCE(SUM(bi_cost.total_cost), 0) AS cost,
                    COALESCE(SUM(b.grand_total) - SUM(bi_cost.total_cost), 0) AS profit
             FROM bills b
             LEFT JOIN (
               SELECT bill_id, SUM(purchase_price * quantity) AS total_cost FROM bill_items GROUP BY bill_id
             ) bi_cost ON bi_cost.bill_id = b.id
             WHERE b.status = 'Active' AND DATE(b.created_at) BETWEEN $1 AND $2
             GROUP BY ${groupBy} ORDER BY ${groupBy}`,
        [start, end]),
    ]);

    res.json({
      success: true,
      data: { sales: salesData.rows, gst: gstData.rows, profit: profitData.rows, period: { start, end, type } },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReports };
