import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkProgress() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE lat IS NOT NULL 
                         AND lat != 0) as geocoded,
        COUNT(*) FILTER (WHERE lat = 0) as failed,
        COUNT(*) FILTER (WHERE lat IS NULL) as pending
      FROM public.ppr_transactions
    `);
    const row = result.rows[0];
    const pct = ((row.geocoded / row.total) * 100).toFixed(1);
    console.log(`Total records:    ${Number(row.total).toLocaleString()}`);
    console.log(`Geocoded:         ${Number(row.geocoded).toLocaleString()} (${pct}%)`);
    console.log(`Failed/not found: ${Number(row.failed).toLocaleString()}`);
    console.log(`Pending:          ${Number(row.pending).toLocaleString()}`);
  } finally {
    client.release();
    await pool.end();
  }
}

checkProgress().catch(console.error);
