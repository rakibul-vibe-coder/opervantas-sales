const { PGlite } = require('@electric-sql/pglite');
const path = require('path');

async function resetAllData() {
  const dbPath = path.join(__dirname, '..', '.pgdata');
  const db = new PGlite(dbPath);

  try {
    console.log('Clearing all sales, expenses, and audit logs...');

    await db.query('DELETE FROM sales;');
    await db.query('DELETE FROM expenses;');
    await db.query('DELETE FROM audit_logs;');

    const salesCount = await db.query('SELECT count(*) FROM sales;');
    const expCount = await db.query('SELECT count(*) FROM expenses;');
    const userCount = await db.query('SELECT count(*) FROM profiles;');

    console.log('Reset complete!');
    console.log('Total Sales:', salesCount.rows[0].count);
    console.log('Total Expenses:', expCount.rows[0].count);
    console.log('Preserved User Accounts:', userCount.rows[0].count);
  } catch (err) {
    console.error('Error during data reset:', err);
  }
}

resetAllData();
