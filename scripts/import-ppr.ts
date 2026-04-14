import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importPPR() {
  const possiblePaths = [
    path.join(process.cwd(), "scripts", "PPR-ALL.csv"),
    path.join(process.cwd(), "PPR-ALL.csv"),
    process.env.PPR_CSV_PATH ?? "",
  ].filter(Boolean);

  let csvPath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p;
      break;
    }
  }

  if (!csvPath) {
    console.error(
      "PPR CSV file not found. Please:\n" +
      "1. Download the CSV from https://www.propertypriceregister.ie\n" +
      "2. Place it at: scripts/PPR-ALL.csv\n" +
      "   OR set the PPR_CSV_PATH environment variable to the full path"
    );
    process.exit(1);
  }

  console.log(`Reading PPR data from: ${csvPath}`);

  const rawBuffer = fs.readFileSync(csvPath);
  const decoder = new TextDecoder("windows-1252");
  const csvText = decoder.decode(rawBuffer);

  console.log("Parsing CSV...");

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  console.log(`Parsed ${records.length} records. Importing to Supabase...`);

  const batchSize = 500;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const rows = batch
      .map((r) => {
        const dateStr =
          r["Date of Sale (dd/mm/yyyy)"] ||
          r["Date of Sale"] ||
          r["date_of_sale"] ||
          "";

        const priceStr = (
          r["Price (€)"] ||
          r["Price"] ||
          r["price"] ||
          ""
        )
          .replace(/[€,\s]/g, "")
          .trim();

        const price = parseFloat(priceStr);

        if (!dateStr || isNaN(price) || price <= 0) {
          skipped++;
          return null;
        }

        const parts = dateStr.trim().split("/");
        if (parts.length !== 3) {
          skipped++;
          return null;
        }

        const saleDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;

        const address = (
          r["Address"] ||
          r["address"] ||
          ""
        ).trim();

        if (!address) {
          skipped++;
          return null;
        }

        return {
          sale_date: saleDate,
          address,
          county: (r["County"] || r["county"] || "").trim() || null,
          eircode: (r["Eircode"] || r["eircode"] || "").trim() || null,
          price,
          description: (
            r["Description of Property"] ||
            r["description"] ||
            ""
          ).trim() || null,
          property_size_desc: (
            r["Property Size Description"] ||
            r["property_size_description"] ||
            ""
          ).trim() || null,
        };
      })
      .filter(Boolean);

    if (rows.length > 0) {
      const { error } = await supabase
        .from("ppr_transactions")
        .upsert(rows, { ignoreDuplicates: true });

      if (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      } else {
        imported += rows.length;
      }
    }

    if (imported % 10000 < batchSize) {
      console.log(
        `Progress: ${imported.toLocaleString()} imported, ` +
        `${skipped} skipped, ` +
        `${records.length - i - batchSize > 0 ? records.length - i - batchSize : 0} remaining...`
      );
    }
  }

  console.log(`\nDone!`);
  console.log(`Imported: ${imported.toLocaleString()} records`);
  console.log(`Skipped:  ${skipped.toLocaleString()} records (invalid data)`);
}

importPPR().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
