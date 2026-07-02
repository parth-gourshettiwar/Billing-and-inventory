const { query, getClient } = require('../config/database');

const createTables = async () => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Settings (single row)
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        shop_name VARCHAR(100) NOT NULL DEFAULT 'My Showroom',
        owner_name VARCHAR(100) NOT NULL DEFAULT 'Owner',
        address TEXT NOT NULL DEFAULT 'Address',
        phone VARCHAR(20) NOT NULL DEFAULT '9999999999',
        email VARCHAR(100) DEFAULT '',
        gstin VARCHAR(15) NOT NULL DEFAULT '00AAAAA0000A1Z5',
        invoice_prefix VARCHAR(10) DEFAULT 'INV',
        footer_message VARCHAR(255) DEFAULT 'Thank you for your business!',
        terms_conditions TEXT DEFAULT 'Goods once sold will not be taken back.',
        currency VARCHAR(10) DEFAULT '₹',
        date_format VARCHAR(20) DEFAULT 'DD-MM-YYYY',
        low_stock_threshold INT DEFAULT 10,
        logo_url TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) DEFAULT '',
        oem_number VARCHAR(100) DEFAULT '',
        hsn_code VARCHAR(20) NOT NULL,
        purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        selling_price_inclusive DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
        stock INT NOT NULL DEFAULT 0,
        unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
        description TEXT DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bills
    await client.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) DEFAULT '',
        vehicle_number VARCHAR(20) NOT NULL,
        taxable_total DECIMAL(12,2) NOT NULL,
        cgst_total DECIMAL(12,2) NOT NULL,
        sgst_total DECIMAL(12,2) NOT NULL,
        grand_total DECIMAL(12,2) NOT NULL,
        amount_in_words VARCHAR(500) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Cancelled')),
        cancel_reason TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bill Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS bill_items (
        id SERIAL PRIMARY KEY,
        bill_id INT REFERENCES bills(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) DEFAULT '',
        oem_number VARCHAR(100) DEFAULT '',
        hsn_code VARCHAR(20) NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        purchase_price DECIMAL(12,2) NOT NULL,
        selling_price_inclusive DECIMAL(12,2) NOT NULL,
        taxable_value DECIMAL(12,2) NOT NULL,
        gst_rate DECIMAL(5,2) NOT NULL,
        cgst_rate DECIMAL(5,2) NOT NULL,
        cgst_amount DECIMAL(12,2) NOT NULL,
        sgst_rate DECIMAL(5,2) NOT NULL,
        sgst_amount DECIMAL(12,2) NOT NULL,
        line_total DECIMAL(12,2) NOT NULL
      )
    `);

    // Stock Movements
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('SALE','PURCHASE','RETURN','ADJUSTMENT')),
        quantity INT NOT NULL,
        stock_before INT NOT NULL,
        stock_after INT NOT NULL,
        reference_bill_id INT REFERENCES bills(id) ON DELETE SET NULL,
        remarks TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inventory History
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_history (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activity Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        ip_address VARCHAR(45) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invoice Sequence
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_sequence (
        financial_year INT PRIMARY KEY,
        last_invoice_number INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_hsn ON products(hsn_code)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_oem ON products(oem_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bills_invoice_number ON bills(invoice_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bill_items_product_id ON bill_items(product_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id)`);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

const seedData = async () => {
  const bcrypt = require('bcryptjs');
  
  // Seed default admin user
  const adminExists = await query('SELECT id FROM users WHERE username = $1', ['admin']);
  if (adminExists.rows.length === 0) {
    const hash = await bcrypt.hash('Admin@123', 12);
    await query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', ['admin', hash]);
    console.log('✅ Default admin user created (username: admin, password: Admin@123)');
  }

  // Seed default settings
  const settingsExist = await query('SELECT id FROM settings WHERE id = 1');
  if (settingsExist.rows.length === 0) {
    await query(`
      INSERT INTO settings (id, shop_name, owner_name, address, phone, email, gstin, invoice_prefix, 
        footer_message, terms_conditions, currency, date_format, low_stock_threshold, logo_url)
      VALUES (1, 'Spare Parts Showroom', 'Shop Owner', '123 Main Street, City - 600001', 
        '9876543210', 'shop@example.com', '33AAAAA0000A1Z5', 'INV',
        'Thank you for your business! Visit again.', 
        'Goods once sold will not be taken back or exchanged.\nAll disputes subject to local jurisdiction.', 
        '₹', 'DD-MM-YYYY', 10, '')
    `);
    console.log('✅ Default settings seeded');
  }
};

module.exports = { createTables, seedData };
