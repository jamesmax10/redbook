import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const area: string = (body?.area ?? "").trim();
    const radiusKm: number = body?.radiusKm ?? 1.5;

    if (!area || area.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const params = new URLSearchParams({
      q: `${area}, Ireland`,
      format: "json",
      limit: "1",
      countrycodes: "ie",
    });

    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "RedBookPro/1.0 (property-valuation-tool)",
        },
      }
    );

    if (!geoRes.ok) {
      return NextResponse.json(
        { error: "Could not geocode area" },
        { status: 422 }
      );
    }

    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return NextResponse.json({
        results: [],
        message: "Area not found. Try a more specific location.",
      });
    }

    const lat = parseFloat(geoData[0].lat);
    const lng = parseFloat(geoData[0].lon);

    console.log(`Area search: ${area} → lat ${lat}, lng ${lng}`);

    const client = await pool.connect();
    let results;
    try {
      const result = await client.query(
        `
        SELECT 
          id,
          sale_date,
          address,
          county,
          eircode,
          price,
          description,
          ST_Distance(
            ST_MakePoint(lng, lat)::geography,
            ST_MakePoint($2, $1)::geography
          ) / 1000 as distance_km
        FROM public.ppr_transactions
        WHERE 
          lat IS NOT NULL 
          AND lat != 0
          AND lng IS NOT NULL
          AND lng != 0
          AND ST_DWithin(
            ST_MakePoint(lng, lat)::geography,
            ST_MakePoint($2, $1)::geography,
            $3
          )
        ORDER BY sale_date DESC
        LIMIT 20
        `,
        [lat, lng, radiusKm * 1000]
      );
      results = result.rows;
    } finally {
      client.release();
    }

    console.log(`Area search returned ${results.length} results`);

    return NextResponse.json({
      results,
      centre: { lat, lng },
      area: geoData[0].display_name,
    });

  } catch (err) {
    const message = err instanceof Error
      ? err.message
      : String(err);
    console.error("Area search error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
