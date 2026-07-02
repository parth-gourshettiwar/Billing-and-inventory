const { query } = require('../config/database');
const { paginate } = require('../utils/helpers');

const getCustomers = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const { limit: l, offset } = paginate(page, limit);
    const params = [];
    let where = '';
    if (search) {
      where = 'WHERE c.customer_name ILIKE $1 OR c.mobile ILIKE $1';
      params.push(`%${search}%`);
    }
    const countResult = await query(`SELECT COUNT(*) FROM customers c ${where}`, params);
    const total = parseInt(countResult.rows[0].count);
    params.push(l, offset);
    const idx = params.length;
    const result = await query(
      `SELECT c.*, 
        COUNT(b.id) FILTER (WHERE b.status = 'Active') AS total_bills,
        COALESCE(SUM(b.grand_total) FILTER (WHERE b.status = 'Active'), 0) AS total_purchase,
        MAX(b.created_at) FILTER (WHERE b.status = 'Active') AS last_purchase
       FROM customers c
       LEFT JOIN bills b ON b.customer_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $${idx-1} OFFSET $${idx}`,
      params
    );
    res.json({ success: true, data: result.rows, meta: { total, page: parseInt(page), limit: l, totalPages: Math.ceil(total / l) } });
  } catch (err) {
    next(err);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cResult = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (!cResult.rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
    const customer = cResult.rows[0];

    const statsResult = await query(
      `SELECT COUNT(*) FILTER (WHERE status = 'Active') AS total_bills,
              COALESCE(SUM(grand_total) FILTER (WHERE status = 'Active'), 0) AS total_purchase,
              MAX(created_at) FILTER (WHERE status = 'Active') AS last_purchase
       FROM bills WHERE customer_id = $1`,
      [id]
    );

    const billsResult = await query(
      'SELECT id, invoice_number, vehicle_number, grand_total, status, created_at FROM bills WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50',
      [id]
    );

    res.json({
      success: true,
      data: { ...customer, ...statsResult.rows[0], bills: billsResult.rows },
    });
  } catch (err) {
    next(err);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { customer_name, mobile = '' } = req.body;
    if (!customer_name) return res.status(400).json({ success: false, message: 'Customer name is required' });
    const result = await query(
      'INSERT INTO customers (customer_name, mobile) VALUES ($1, $2) RETURNING *',
      [customer_name.trim(), mobile.trim()]
    );
    res.status(201).json({ success: true, message: 'Customer created successfully', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const searchCustomers = async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    const result = await query(
      'SELECT id, customer_name, mobile FROM customers WHERE customer_name ILIKE $1 OR mobile ILIKE $1 ORDER BY customer_name LIMIT 10',
      [`%${q}%`]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomers, getCustomer, createCustomer, searchCustomers };
