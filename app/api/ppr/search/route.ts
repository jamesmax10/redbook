import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Auth check via Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rawAddress: string = (body?.address ?? "").trim();

    if (!rawAddress || rawAddress.length < 4) {
      return NextResponse.json({ results: [] });
    }

    // Take only the part before the first comma
    // and convert to uppercase to match PPR format
    const firstPart = rawAddress
      .split(",")[0]
      .trim()
      .toUpperCase();

    if (!firstPart || firstPart.length < 4) {
      return NextResponse.json({ results: [] });
    }

    console.log("PPR search term:", firstPart);

    // Detect county from full address
    const countyHints: Record<string, string> = {
      dublin: "Dublin", galway: "Galway", cork: "Cork",
      limerick: "Limerick", waterford: "Waterford",
      kilkenny: "Kilkenny", wexford: "Wexford",
      wicklow: "Wicklow", kildare: "Kildare", meath: "Meath",
      louth: "Louth", westmeath: "Westmeath", offaly: "Offaly",
      laois: "Laois", carlow: "Carlow", tipperary: "Tipperary",
      clare: "Clare", mayo: "Mayo", sligo: "Sligo",
      roscommon: "Roscommon", leitrim: "Leitrim",
      longford: "Longford", cavan: "Cavan", monaghan: "Monaghan",
      donegal: "Donegal", kerry: "Kerry",
    };

    const lowerAddress = rawAddress.toLowerCase();
    let countyFilter: string | null = null;
    for (const [key, value] of Object.entries(countyHints)) {
      if (lowerAddress.includes(key)) {
        countyFilter = value;
        break;
      }
    }

    // Direct Postgres query - bypasses Supabase REST layer
    // Uses the upper(address) index for fast prefix matching
    let queryText: string;
    let queryParams: (string | null)[];

    if (countyFilter) {
      queryText = `
        SELECT id, sale_date, address, county, eircode, 
               price, description
        FROM public.ppr_transactions
        WHERE upper(address) LIKE $1
          AND county ILIKE $2
        ORDER BY sale_date DESC
        LIMIT 8
      `;
      queryParams = [`${firstPart}%`, countyFilter];
    } else {
      queryText = `
        SELECT id, sale_date, address, county, eircode,
               price, description
        FROM public.ppr_transactions
        WHERE upper(address) LIKE $1
        ORDER BY sale_date DESC
        LIMIT 8
      `;
      queryParams = [`${firstPart}%`];
    }

    const client = await pool.connect();
    let results;
    try {
      const result = await client.query(queryText, queryParams);
      results = result.rows;
    } finally {
      client.release();
    }

    console.log(`PPR search returned ${results.length} results`);

    return NextResponse.json({ results });

  } catch (err) {
    const message = err instanceof Error 
      ? err.message 
      : String(err);
    console.error("PPR route error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
