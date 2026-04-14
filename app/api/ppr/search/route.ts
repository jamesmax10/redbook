import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rawAddress: string = (body?.address ?? "").trim();

    if (!rawAddress || rawAddress.length < 4) {
      return NextResponse.json({ results: [] });
    }

    const firstPart = rawAddress
      .split(",")[0]
      .trim()
      .toUpperCase();

    console.log("PPR search term:", firstPart);

    if (!firstPart || firstPart.length < 4) {
      return NextResponse.json({ results: [] });
    }

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

    const { data, error } = await supabase
      .rpc("search_ppr", {
        search_term: firstPart,
        county_filter: countyFilter ?? null,
      });

    if (error) {
      console.error("PPR search error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ results: data ?? [] });

  } catch (err) {
    console.error("PPR route error:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
