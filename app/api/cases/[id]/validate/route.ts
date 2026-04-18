import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { runHardRules } from "@/lib/validation/redBookRules";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    { data: caseData },
    { data: property },
    { data: comparables },
    { data: valuation },
  ] = await Promise.all([
    supabase.from("cases").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("properties").select("*").eq("case_id", id).maybeSingle(),
    supabase.from("comparables").select("*").eq("case_id", id),
    supabase.from("valuations").select("*").eq("case_id", id).maybeSingle(),
  ]);

  if (!caseData) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const hardRuleResult = runHardRules({
    caseData,
    property,
    comparables: comparables ?? [],
    valuation,
  });

  let aiFindings: Array<{
    severity: "warning" | "pass";
    title: string;
    detail: string;
    action: string;
  }> = [];

  if (hardRuleResult.canProceedToAI && process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const rates = (comparables ?? []).map((c) =>
        Number(c.adjusted_rate_per_sqm ?? c.rate_per_sqm)
      );
      const avgRate = rates.length
        ? rates.reduce((a, b) => a + b, 0) / rates.length
        : 0;

      const prompt = `You are a RICS-qualified senior valuer reviewing a commercial \
valuation report for Red Book compliance.

VALUATION DATA:
- Property: ${caseData.property_address}
- Property Type: ${property?.property_type ?? "Not stated"}
- GIA: ${property?.gross_internal_area ?? "Not stated"} sq m
- Purpose: ${caseData.purpose}
- Basis of Value: ${caseData.basis_of_value}
- Valuation Date: ${caseData.valuation_date}

COMPARABLE EVIDENCE (${(comparables ?? []).length} comparables):
${(comparables ?? [])
  .map(
    (c, i) =>
      `${i + 1}. ${c.address} | ${c.transaction_type} | ${c.transaction_date} | €${Number(c.price_or_rent).toLocaleString()} | ${c.gross_internal_area}m² | €${Number(c.adjusted_rate_per_sqm ?? c.rate_per_sqm).toFixed(2)}/m²`
  )
  .join("\n")}

Average adjusted rate: €${avgRate.toFixed(2)}/m²
Adopted rate: €${Number(valuation?.adopted_rate_per_sqm ?? 0).toFixed(2)}/m²

RATIONALE PROVIDED:
"${valuation?.adopted_rate_rationale ?? "None"}"

ASSUMPTIONS:
"${valuation?.assumptions ?? "None"}"

Review this valuation and identify any quality concerns.
Focus on:
1. Is the rationale substantive — does it reference specific evidence?
2. Are the comparables appropriate for the subject property type?
3. Is the adopted rate selection well justified?
4. Any internal inconsistencies?

Respond ONLY with a JSON array. No preamble. No markdown.
Each item must have: severity ("warning" or "pass"), title, detail, action.
Maximum 4 findings. Only flag genuine concerns.

Example format:
[{"severity":"warning","title":"...","detail":"...","action":"..."}]`;

      const response = await client.messages.create({
        model: "claude-haiku-20240307",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");

      const clean = text.replace(/```json|```/g, "").trim();
      aiFindings = JSON.parse(clean);
    } catch (err) {
      console.error("AI validation error:", err);
    }
  }

  return NextResponse.json({
    hardRules: hardRuleResult,
    aiFindings,
    summary: {
      critical: hardRuleResult.criticalCount,
      warnings:
        hardRuleResult.warningCount +
        aiFindings.filter((f) => f.severity === "warning").length,
      passed: hardRuleResult.passCount,
      aiRan: aiFindings.length > 0,
    },
  });
}
