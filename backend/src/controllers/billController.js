const { getClient, query } = require('../config/database');
const { calculateGST, amountInWords, getFinancialYear, paginate } = require('../utils/helpers');

// Generate next invoice number inside transaction
const generateInvoiceNumber = async (client, prefix = 'INV') => {
  const fy = getFinancialYear();
  const result = await client.query(
    `INSERT INTO invoice_sequence (financial_year, last_invoice_number)
     VALUES ($1, 1)
     ON CONFLICT (financial_year) DO UPDATE
     SET last_invoice_number = invoice_sequence.last_invoice_number + 1,
         updated_at = CURRENT_TIMESTAMP
     RETURNING last_invoice_number`,
    [fy]
  );
  const num = result.rows[0].last_invoice_number;
  return `${prefix}/${fy}/${String(num).padStart(6, '0')}`;
};

const createBill = async (req, res, next) => {
  const client = await getClient();
  try {
    const { customer_id, customer_name, mobile = '', vehicle_number, items } = req.body;

    if (!customer_name) return res.status(400).json({ success: false, message: 'Customer name is required' });
    if (!vehicle_number) return res.status(400).json({ success: false, message: 'Vehicle number is required' });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product is required' });
    }

    // Get settings for invoice prefix
    const settingsRes = await query('SELECT invoice_prefix FROM settings WHERE id = 1');
    const prefix = settingsRes.rows[0]?.invoice_prefix || 'INV';

    await client.query('BEGIN');

    // Lock and validate all products
    const productIds = items.map(i => i.product_id);
    const lockedProducts = await client.query(
      `SELECT * FROM products WHERE id = ANY($1) AND status = 'Active' FOR UPDATE`,
      [productIds]
    );

    const productMap = {};
    lockedProducts.rows.forEach(p => { productMap[p.id] = p; });

    // Validate each item
    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Product ID ${item.product_id} not found or inactive` });
      }
      if (item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Invalid quantity for ${product.product_name}` });
      }
      if (product.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.product_name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    // Generate invoice number
    const invoice_number = await generateInvoiceNumber(client, prefix);

    // Calculate totals
    let taxable_total = 0, cgst_total = 0, sgst_total = 0, grand_total = 0;
    const processedItems = items.map(item => {
      const product = productMap[item.product_id];
      const gst = calculateGST(product.selling_price_inclusive, product.gst_rate, item.quantity);
      taxable_total += gst.taxable_value;
      cgst_total += gst.cgst_amount;
      sgst_total += gst.sgst_amount;
      grand_total += gst.line_total;
      return { item, product, gst };
    });

    taxable_total = parseFloat(taxable_total.toFixed(2));
    cgst_total = parseFloat(cgst_total.toFixed(2));
    sgst_total = parseFloat(sgst_total.toFixed(2));
    grand_total = parseFloat(grand_total.toFixed(2));

    // Create bill
    const billResult = await client.query(
      `INSERT INTO bills (invoice_number, customer_id, customer_name, mobile, vehicle_number,
         taxable_total, cgst_total, sgst_total, grand_total, amount_in_words)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [invoice_number, customer_id || null, customer_name, mobile, vehicle_number,
       taxable_total, cgst_total, sgst_total, grand_total, amountInWords(grand_total)]
    );
    const bill = billResult.rows[0];

    // Insert bill items, update stock, record movements
    for (const { item, product, gst } of processedItems) {
      await client.query(
        `INSERT INTO bill_items (bill_id, product_id, product_name, brand, oem_number, hsn_code,
           quantity, purchase_price, selling_price_inclusive, taxable_value, gst_rate,
           cgst_rate, cgst_amount, sgst_rate, sgst_amount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [bill.id, product.id, product.product_name, product.brand, product.oem_number, product.hsn_code,
         item.quantity, product.purchase_price, product.selling_price_inclusive, gst.taxable_value, gst.gst_rate,
         gst.cgst_rate, gst.cgst_amount, gst.sgst_rate, gst.sgst_amount, gst.line_total]
      );

      const stockBefore = product.stock;
      const stockAfter = product.stock - item.quantity;
      await client.query(
        'UPDATE products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [stockAfter, product.id]
      );
      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, stock_before, stock_after, reference_bill_id, remarks)
         VALUES ($1, 'SALE', $2, $3, $4, $5, $6)`,
        [product.id, item.quantity, stockBefore, stockAfter, bill.id, `Sale via ${invoice_number}`]
      );
    }

    await client.query('COMMIT');

    // Log activity
    await query('INSERT INTO activity_logs (action, description) VALUES ($1, $2)',
      ['INVOICE_GENERATED', `Invoice ${invoice_number} generated for ${customer_name}`]);

    // Fetch full bill with items
    const fullBill = await getBillById(bill.id);
    res.status(201).json({ success: true, message: 'Invoice generated successfully', data: fullBill });

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

const getBillById = async (billId) => {
  const billResult = await query('SELECT * FROM bills WHERE id = $1', [billId]);
  const bill = billResult.rows[0];
  const itemsResult = await query('SELECT * FROM bill_items WHERE bill_id = $1', [billId]);
  const settingsResult = await query('SELECT * FROM settings WHERE id = 1');
  return { ...bill, items: itemsResult.rows, settings: settingsResult.rows[0] };
};

const getBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await getBillById(id);
    if (!bill) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

const getBills = async (req, res, next) => {
  try {
    const { search = '', status = '', dateRange = '', startDate, endDate, page = 1, limit = 20 } = req.query;
    const { limit: l, offset } = paginate(page, limit);
    const params = [];
    let conditions = [];
    let idx = 1;

    if (search) {
      conditions.push(`(b.invoice_number ILIKE $${idx} OR b.customer_name ILIKE $${idx} OR b.mobile ILIKE $${idx} OR b.vehicle_number ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { conditions.push(`b.status = $${idx}`); params.push(status); idx++; }

    const now = new Date();
    if (dateRange === 'today') {
      conditions.push(`DATE(b.created_at) = CURRENT_DATE`);
    } else if (dateRange === 'week') {
      conditions.push(`b.created_at >= CURRENT_DATE - INTERVAL '7 days'`);
    } else if (dateRange === 'month') {
      conditions.push(`EXTRACT(MONTH FROM b.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM b.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`);
    } else if (dateRange === 'custom' && startDate && endDate) {
      conditions.push(`DATE(b.created_at) BETWEEN $${idx} AND $${idx+1}`);
      params.push(startDate, endDate); idx += 2;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countResult = await query(`SELECT COUNT(*) FROM bills b ${where}`, params);
    const total = parseInt(countResult.rows[0].count);
    params.push(l, offset);
    const result = await query(
      `SELECT b.id, b.invoice_number, b.customer_name, b.vehicle_number, b.mobile, b.grand_total, b.status, b.created_at
       FROM bills b ${where} ORDER BY b.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );
    res.json({ success: true, data: result.rows, meta: { total, page: parseInt(page), limit: l, totalPages: Math.ceil(total / l) } });
  } catch (err) {
    next(err);
  }
};

const cancelBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancel_reason } = req.body;
    if (!cancel_reason) return res.status(400).json({ success: false, message: 'Cancel reason is required' });

    const existing = await query('SELECT * FROM bills WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (existing.rows[0].status === 'Cancelled') return res.status(400).json({ success: false, message: 'Invoice already cancelled' });

    const result = await query(
      'UPDATE bills SET status = $1, cancel_reason = $2 WHERE id = $3 RETURNING *',
      ['Cancelled', cancel_reason, id]
    );

    await query('INSERT INTO activity_logs (action, description) VALUES ($1, $2)',
      ['INVOICE_CANCELLED', `Invoice ${existing.rows[0].invoice_number} cancelled. Reason: ${cancel_reason}`]);

    res.json({ success: true, message: 'Invoice cancelled successfully', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBill, getBill, getBills, cancelBill };
