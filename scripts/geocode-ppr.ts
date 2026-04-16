import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryWithRetry(
  fn: (client: import("pg").PoolClient) => Promise<any>,
  retries = 3
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const client = await pool.connect();
    try {
      const result = await fn(client);
      client.release();
      return result;
    } catch (err) {
      client.release(true);
      if (i === retries - 1) throw err;
      console.log(`DB error, retrying (${i + 1}/${retries})...`);
      await sleep(2000);
    }
  }
}

async function geocodeTown(
  town: string,
  county: string | null
): Promise<{ lat: number; lng: number } | null> {
  try {
    const parts = [town, county, "Ireland"]
      .filter(Boolean)
      .join(", ");

    const params = new URLSearchParams({
      q: parts,
      format: "json",
      limit: "1",
      countrycodes: "ie",
    });

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "User-Agent": "RedBookPro/1.0 (property-valuation-tool)",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

async function geocodePPR() {
  try {
    // Get all unique town+county combinations that appear
    // 10+ times and have not been geocoded yet
    const townsResult = await queryWithRetry((client) =>
      client.query(`
        SELECT 
          TRIM(SPLIT_PART(address, ',', 2)) as town,
          county,
          COUNT(*) as record_count
        FROM public.ppr_transactions
        WHERE address LIKE '%,%'
          AND lat IS NULL
        GROUP BY town, county
        HAVING COUNT(*) >= 10
        ORDER BY COUNT(*) DESC
      `)
    );

    const towns = townsResult.rows;
    console.log(`Towns to geocode: ${towns.length}`);
    console.log(
      `Estimated time: ${Math.ceil(towns.length / 60)} minutes`
    );

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let recordsUpdated = 0;

    for (const row of towns) {
      const coords = await geocodeTown(row.town, row.county);

      if (coords && coords.lat !== 0 && coords.lng !== 0) {
        // Update ALL records matching this town+county in bulk
        const updateResult = await queryWithRetry((client) =>
          client.query(`
            UPDATE public.ppr_transactions
            SET lat = $1, lng = $2
            WHERE TRIM(SPLIT_PART(address, ',', 2)) = $3
              AND county = $4
              AND lat IS NULL
          `, [coords.lat, coords.lng, row.town, row.county])
        );

        recordsUpdated += updateResult.rowCount ?? 0;
        succeeded++;
      } else {
        // Mark as attempted with sentinel value 0,0
        await queryWithRetry((client) =>
          client.query(`
            UPDATE public.ppr_transactions
            SET lat = 0, lng = 0
            WHERE TRIM(SPLIT_PART(address, ',', 2)) = $1
              AND county = $2
              AND lat IS NULL
          `, [row.town, row.county])
        );
        failed++;
      }

      processed++;

      if (processed % 50 === 0) {
        const pct = ((processed / towns.length) * 100).toFixed(1);
        const eta = Math.ceil(
          ((towns.length - processed) * DELAY_MS) / 60000
        );
        console.log(
          `Progress: ${processed}/${towns.length} towns (${pct}%) — ` +
          `${recordsUpdated} PPR records updated — ` +
          `~${eta} min remaining`
        );
      }

      await sleep(DELAY_MS);
    }

    console.log("\nGeocoding complete!");
    console.log(`Towns processed: ${processed}`);
    console.log(`Towns geocoded: ${succeeded}`);
    console.log(`Towns failed: ${failed}`);
    console.log(`PPR records updated: ${recordsUpdated}`);

  } finally {
    await pool.end();
  }
}

geocodePPR().catch((err) => {
  console.error("Geocoding failed:", err);
  process.exit(1);
});
