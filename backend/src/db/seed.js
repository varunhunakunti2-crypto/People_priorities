const fs = require('fs');
const path = require('path');
const db = require('./index');

const runSeed = async () => {
  try {
    console.log('Starting database seeding...');
    const seedPath = path.join(__dirname, 'seed.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');
    
    await db.query(sql);
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
