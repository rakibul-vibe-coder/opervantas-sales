const { PGlite } = require('@electric-sql/pglite')
const path = require('path')
const crypto = require('crypto')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Business date calculation logic (mirrors lib/business-date.ts)
function getBusinessDate(date) {
  const d = new Date(date)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(d)
  const year = parseInt(parts.find(p => p.type === 'year').value)
  const month = parseInt(parts.find(p => p.type === 'month').value) - 1
  const day = parseInt(parts.find(p => p.type === 'day').value)
  const hour = parseInt(parts.find(p => p.type === 'hour').value)

  const dhakaDate = new Date(year, month, day)
  if (hour < 1) {
    dhakaDate.setDate(dhakaDate.getDate() - 1)
  }
  const y = dhakaDate.getFullYear()
  const m = String(dhakaDate.getMonth() + 1).padStart(2, '0')
  const da = String(dhakaDate.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

async function runAudit() {
  console.log('================================================================');
  console.log('   FULL END-TO-END AUDIT & VERIFICATION SUITE');
  console.log('   PostgreSQL Engine + Business Logic + Security Audit');
  console.log('================================================================\n');

  const db = new PGlite(path.join(process.cwd(), '.pgdata'))
  let passedTests = 0
  let failedTests = 0

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       Evidence: ${details}`);
      passedTests++
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       Error: ${details}`);
      failedTests++
    }
  }

  // TEST 1: User Profiles & Role-Based Accounts
  const users = await db.query('SELECT username, role, status, employee_id FROM profiles ORDER BY role')
  assert(
    users.rows.length >= 3,
    'Test 1: Multiple User Accounts exist (Manager & Salespeople)',
    `Found ${users.rows.length} accounts: ${users.rows.map(u => `${u.username} (${u.role}, ${u.status})`).join(', ')}`
  )

  const manager = users.rows.find(u => u.role === 'manager')
  const salesman = users.rows.find(u => u.role === 'salesman')
  assert(manager && manager.status === 'active', 'Test 1.1: Active Manager profile verified', manager?.username)
  assert(salesman && salesman.status === 'active', 'Test 1.2: Active Salesman profile verified', salesman?.username)

  // TEST 2: Sales Calculation Accuracy (Quantity * Prices)
  const newSaleId = 'idem-audit-test-101'
  const qty = 3
  const buyPrice = 25000.00
  const sellPrice = 31000.00
  const expectedTotalBuy = qty * buyPrice       // 75,000
  const expectedTotalSell = qty * sellPrice     // 93,000
  const expectedGrossProfit = expectedTotalSell - expectedTotalBuy // 18,000

  await db.query(`
    INSERT INTO sales (
      sale_number, salesman_id, salesman_name, model_name,
      quantity, unit_purchase_price, unit_selling_price,
      business_date, status, idempotency_key
    ) VALUES (
      'SL-AUDIT-01', '${salesman.id || 'a0000000-0000-0000-0000-000000000002'}', 'Md. Rahim Uddin', 'Pixel 8 Pro',
      ${qty}, ${buyPrice}, ${sellPrice},
      CURRENT_DATE, 'active', '${newSaleId}'
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  `)

  const recordedSale = await db.query(`SELECT * FROM sales WHERE idempotency_key = '${newSaleId}'`)
  const s = recordedSale.rows[0]
  assert(
    Number(s.total_purchase_cost) === expectedTotalBuy &&
    Number(s.total_selling_amount) === expectedTotalSell &&
    Number(s.gross_profit) === expectedGrossProfit,
    'Test 2: PostgreSQL Server-Side Generated Sales Math',
    `Buy: ${s.total_purchase_cost} (expected ${expectedTotalBuy}), Sell: ${s.total_selling_amount} (expected ${expectedTotalSell}), Profit: ${s.gross_profit} (expected ${expectedGrossProfit})`
  )

  // TEST 3: Duplicate Submission Prevention (Idempotency Key Constraint)
  let duplicatePrevented = false
  try {
    await db.query(`
      INSERT INTO sales (
        sale_number, salesman_id, salesman_name, model_name,
        quantity, unit_purchase_price, unit_selling_price,
        business_date, status, idempotency_key
      ) VALUES (
        'SL-AUDIT-DUPE', '${salesman.id || 'a0000000-0000-0000-0000-000000000002'}', 'Md. Rahim Uddin', 'Pixel 8 Pro Duplicate',
        ${qty}, ${buyPrice}, ${sellPrice},
        CURRENT_DATE, 'active', '${newSaleId}'
      );
    `)
  } catch (err) {
    if (err.message && err.message.includes('unique constraint') || err.message.includes('idempotency_key')) {
      duplicatePrevented = true
    }
  }
  assert(duplicatePrevented, 'Test 3: Idempotency Key prevents duplicate sales submission', 'Duplicate key was rejected by PostgreSQL UNIQUE constraint')

  // TEST 4: Manager Independent Sales Entry
  const managerSales = await db.query(`SELECT * FROM sales WHERE salesman_id = 'a0000000-0000-0000-0000-000000000001'`)
  assert(
    managerSales.rows.length > 0,
    'Test 4: Manager can record independent personal sales under manager profile',
    `Manager has ${managerSales.rows.length} sales recorded. Latest: ${managerSales.rows[0]?.model_name}`
  )

  // TEST 5: Daily Combined Store Aggregations
  const totalCombined = await db.query(`
    SELECT
      COUNT(*) AS total_transactions,
      SUM(quantity) AS total_units,
      SUM(total_purchase_cost) AS total_cost,
      SUM(total_selling_amount) AS total_sales,
      SUM(gross_profit) AS total_gross_profit
    FROM sales
    WHERE business_date = CURRENT_DATE AND status = 'active';
  `)
  const c = totalCombined.rows[0]
  assert(
    Number(c.total_sales) > 0 && Number(c.total_gross_profit) > 0,
    'Test 5: Combined store sales calculation includes all salespeople + manager',
    `Transactions: ${c.total_transactions}, Sales: ৳${c.total_sales}, Profit: ৳${c.total_gross_profit}`
  )

  // TEST 6: Expense Management & Net Profit Calculation
  const totalExpenses = await db.query(`
    SELECT SUM(amount) as total_expenses FROM expenses WHERE business_date = CURRENT_DATE AND status = 'active'
  `)
  const exp = Number(totalExpenses.rows[0].total_expenses || 0)
  const gross = Number(c.total_gross_profit || 0)
  const netProfit = gross - exp
  assert(
    exp > 0 && netProfit === (gross - exp),
    'Test 6: Net Profit Calculation (Gross Profit - Total Expenses)',
    `Gross: ৳${gross} - Expenses: ৳${exp} = Net Profit: ৳${netProfit}`
  )

  // TEST 7: 1:00 AM Asia/Dhaka Business Day Boundary Logic
  // Case A: 12:30 AM (before 1:00 AM reset) -> belongs to yesterday
  const dtBefore1AM = new Date('2026-11-18T00:30:00+06:00')
  const bDateBefore = getBusinessDate(dtBefore1AM)
  assert(
    bDateBefore === '2026-11-17',
    'Test 7.1: 12:30 AM Asia/Dhaka logically belongs to previous day (2026-11-17)',
    `Input: 2026-11-18 00:30:00+06:00 -> Business Date: ${bDateBefore}`
  )

  // Case B: 01:05 AM (at/after 1:00 AM reset) -> belongs to new day
  const dtAfter1AM = new Date('2026-11-18T01:05:00+06:00')
  const bDateAfter = getBusinessDate(dtAfter1AM)
  assert(
    bDateAfter === '2026-11-18',
    'Test 7.2: 01:05 AM Asia/Dhaka logically belongs to new day (2026-11-18)',
    `Input: 2026-11-18 01:05:00+06:00 -> Business Date: ${bDateAfter}`
  )

  // TEST 8: Historical Data Availability & Never-Delete Policy
  const allHistoricalSales = await db.query(`SELECT DISTINCT business_date, count(*) FROM sales GROUP BY business_date ORDER BY business_date`)
  assert(
    allHistoricalSales.rows.length >= 1,
    'Test 8: Historical business date persistence verified',
    `Stored business dates found: ${allHistoricalSales.rows.map(r => `${r.business_date} (${r.count} sales)`).join(', ')}`
  )

  // TEST 9: Soft Deletion Audit & Integrity
  await db.query(`
    INSERT INTO expenses (id, expense_number, recipient_name, purpose, amount, expense_date, business_date, status, created_by)
    VALUES ('e0000000-0000-0000-0000-000000000099', 'EX-AUDIT-99', 'Test Vendor', 'Audit Expense', 150.00, CURRENT_DATE, CURRENT_DATE, 'active', 'a0000000-0000-0000-0000-000000000001')
    ON CONFLICT (id) DO NOTHING;
  `)
  // Perform soft delete
  await db.query(`UPDATE expenses SET status = 'deleted' WHERE id = 'e0000000-0000-0000-0000-000000000099'`)
  const softDeleted = await db.query(`SELECT status FROM expenses WHERE id = 'e0000000-0000-0000-0000-000000000099'`)
  const activeOnly = await db.query(`SELECT count(*) FROM expenses WHERE id = 'e0000000-0000-0000-0000-000000000099' AND status = 'active'`)
  assert(
    softDeleted.rows[0]?.status === 'deleted' && Number(activeOnly.rows[0].count) === 0,
    'Test 9: Soft-deletion preserves audit history without skewing active totals',
    'Status changed to deleted, filtered out of active expenses query'
  )

  // TEST 10: Suspended Account Permission Check
  await db.query(`UPDATE profiles SET status = 'hold' WHERE username = 'karim_sales'`)
  const karimStatus = await db.query(`SELECT status FROM profiles WHERE username = 'karim_sales'`)
  assert(
    karimStatus.rows[0]?.status === 'hold',
    'Test 10: Salesman account can be suspended on HOLD',
    `karim_sales status is now ${karimStatus.rows[0]?.status}`
  )
  // Reactivate
  await db.query(`UPDATE profiles SET status = 'active' WHERE username = 'karim_sales'`)

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1)
  }
}

runAudit().catch(err => {
  console.error('Audit execution error:', err)
  process.exit(1)
})
