require('dotenv').config();
const app = require('./src/app');
const { createTables, seedData } = require('./src/database/schema');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // 1. Verify database is reachable before doing anything else
    const dbOk = await testConnection();
    if (!dbOk) {
      console.error('❌ Cannot reach the database. Check DATABASE_URL in .env');
      process.exit(1);
    }

    // 2. Create tables & seed default data
    await createTables();
    await seedData();

    // 3. Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
