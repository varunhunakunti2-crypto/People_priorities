const fs = require('fs');
const path = require('path');
const db = require('./index');

const runMigration = async () => {
  try {
    console.log('Starting database migration...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    await db.query(sql);
    console.log('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
};

runMigration();
