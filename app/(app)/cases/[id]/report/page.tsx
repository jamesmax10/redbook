import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Adjustment } from "@/lib/types";
import { fmtCurrency, fmtDate } from "@/lib/format";
import {
  card,
  pageTitle,
  sectionTitle,
  overline,
  backLink,
  thClass,
  tdBase,
  trHover,
} from "@/lib/styles";
import ExportButton from "./ExportButton";
import ValidationPanel from "../ValidationPanel";

export const dynamic = "force-dynamic";

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="border-l-2 border-red-500 pl-3 mb-4">
      <p className={overline}>Section {number}</p>
      <h2 className={sectionTitle}>{title}</h2>
    </div>
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex justify-between py-3 border-b border-zinc-50 last:border-0">
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900 text-right">
        {value ?? <span className="text-zinc-300 italic">Not provided</span>}
      </dd>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-zinc-400 py-4">{message}</p>;
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (caseError || !caseData) {
    notFound();
  }

  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("*")
    .eq("case_id", id)
    .maybeSingle();

  if (propError) throw propError;

  const { data: comparables } = await supabase
    .from("comparables")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: false });

  const { data: valuation, error: valError } = await supabase
    .from("valuations")
    .select("*")
    .eq("case_id", id)
    .maybeSingle();

  if (valError) throw valError;

  const comparableCount = comparables?.length ?? 0;

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Draft Report
          </span>
          <span className="text-xs text-zinc-400">— not yet validated</span>
        </div>
        <ExportButton caseId={id} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-8 items-start">
      <div>

      {/* Report Header */}
      <div className="mb-12 pb-8 border-b border-zinc-100">
        <p className={`${overline} mb-2`}>Valuation Report</p>
        <h1 className={`${pageTitle} mb-1`}>{caseData.property_address}</h1>
        <p className="text-sm text-zinc-500">
          Prepared for {caseData.client_name}
        </p>
        <p className="text-sm text-zinc-400 mt-1">
          Valuation Date: {fmtDate(caseData.valuation_date)} &middot; Report
          Date: {fmtDate(new Date().toISOString())}
        </p>
      </div>

      <div className="space-y-14">
        {/* Section 1: Property Overview */}
        <section>
          <SectionHeading number={1} title="Property Overview" />
          {property ? (
            <div className={`${card} px-6 py-4`}>
              <dl>
                <FieldRow label="Address" value={property.address} />
                <FieldRow
                  label="Property Type"
                  value={property.property_type}
                />
                <FieldRow
                  label="Gross Internal Area"
                  value={
                    property.gross_internal_area
                      ? `${Number(property.gross_internal_area).toLocaleString("en-IE")} sq m`
                      : null
                  }
                />
                <FieldRow label="Condition" value={property.condition} />
                <FieldRow label="Tenure" value={property.tenure} />
              </dl>
            </div>
          ) : (
            <EmptyState message="No subject property recorded for this case." />
          )}
        </section>

        {/* Section 2: Valuation Context */}
        <section>
          <SectionHeading number={2} title="Valuation Context" />
          <div className={`${card} px-6 py-4`}>
            <dl>
              <FieldRow label="Client" value={caseData.client_name} />
              <FieldRow
                label="Valuation Date"
                value={fmtDate(caseData.valuation_date)}
              />
              <FieldRow
                label="Report Date"
                value={fmtDate(new Date().toISOString())}
              />
              <FieldRow label="Purpose" value={caseData.purpose} />
              <FieldRow
                label="Basis of Value"
                value={caseData.basis_of_value}
              />
            </dl>
          </div>
        </section>

        {/* Section 3: Comparable Evidence */}
        <section>
          <SectionHeading number={3} title="Comparable Evidence" />
          {comparables && comparables.length > 0 ? (
            <div className={`${card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className={`text-left px-5 py-3 ${thClass}`}>
                        Address
                      </th>
                      <th className={`text-left px-5 py-3 ${thClass}`}>
                        Type
                      </th>
                      <th className={`text-right px-5 py-3 ${thClass}`}>
                        Price / Rent
                      </th>
                      <th className={`text-right px-5 py-3 ${thClass}`}>
                        Area (sq&nbsp;m)
                      </th>
                      <th className={`text-right px-5 py-3 ${thClass}`}>
                        &euro;/sq&nbsp;m
                      </th>
                      <th className={`text-right px-5 py-3 ${thClass}`}>
                        Adj. &euro;/sq&nbsp;m
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {comparables.map(
                      (comp: {
                        id: string;
                        address: string;
                        transaction_type: string;
                        price_or_rent: number;
                        gross_internal_area: number;
                        rate_per_sqm: number;
                        adjustments: Adjustment[] | null;
                        adjusted_rate_per_sqm: number | null;
                      }) => {
                        const adjTotal = comp.adjustments
                          ? comp.adjustments.reduce(
                              (sum: number, a: Adjustment) =>
                                sum + a.percentage,
                              0
                            )
                          : 0;

                        return (
                          <tr key={comp.id} className={trHover}>
                            <td className={`${tdBase} text-zinc-900`}>
                              {comp.address}
                            </td>
                            <td className={`${tdBase} text-zinc-600`}>
                              {comp.transaction_type}
                            </td>
                            <td
                              className={`${tdBase} text-right text-zinc-600 tabular-nums`}
                            >
                              &euro;{fmtCurrency(comp.price_or_rent)}
                            </td>
                            <td
                              className={`${tdBase} text-right text-zinc-600 tabular-nums`}
                            >
                              {Number(
                                comp.gross_internal_area
                              ).toLocaleString("en-IE")}
                            </td>
                            <td
                              className={`${tdBase} text-right text-zinc-600 tabular-nums`}
                            >
                              &euro;
                              {fmtCurrency(Number(comp.rate_per_sqm))}
                            </td>
                            <td
                              className={`${tdBase} text-right font-medium text-zinc-900 tabular-nums`}
                            >
                              &euro;
                              {fmtCurrency(comp.adjusted_rate_per_sqm ?? Number(comp.rate_per_sqm))}
                              {adjTotal !== 0 && (
                                <span
                                  className={`ml-1.5 text-xs ${adjTotal > 0 ? "text-emerald-600" : "text-red-500"}`}
                                >
                                  {adjTotal > 0 ? "+" : ""}
                                  {adjTotal.toFixed(1)}%
                                </span>
                              )}
                              {!comp.adjustments && (
                                <span className="ml-1.5 text-xs text-zinc-400">
                                  (unadjusted)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
              {comparables.some(
                (c: { adjustments: Adjustment[] | null }) =>
                  c.adjustments && c.adjustments.length > 0
              ) && (
                <div className="px-5 py-4 border-t border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Adjustment Rationale
                  </p>
                  {comparables
                    .filter(
                      (c: { adjustments: Adjustment[] | null }) =>
                        c.adjustments && c.adjustments.length > 0
                    )
                    .map(
                      (c: {
                        id: string;
                        address: string;
                        adjustments: Adjustment[];
                      }) => (
                        <div key={c.id} className="mb-3 last:mb-0">
                          <p className="text-sm font-medium text-zinc-800">
                            {c.address}
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {c.adjustments.map(
                              (adj: Adjustment, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-zinc-500"
                                >
                                  {adj.factor.charAt(0).toUpperCase() +
                                    adj.factor.slice(1)}{" "}
                                  <span
                                    className={
                                      adj.percentage >= 0
                                        ? "text-emerald-600"
                                        : "text-red-500"
                                    }
                                  >
                                    {adj.percentage >= 0 ? "+" : ""}
                                    {adj.percentage}%
                                  </span>
                                  {adj.rationale?.trim() && (
                                    <span className="text-zinc-400">
                                      : {adj.rationale.trim()}
                                    </span>
                                  )}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>
          ) : (
            <EmptyState message="No comparable evidence recorded for this case." />
          )}
        </section>

        {/* Section 4: Valuation Conclusion */}
        <section>
          <SectionHeading number={4} title="Valuation Conclusion" />
          {valuation?.adopted_rate_per_sqm != null ? (
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">
                    Adopted Rate per sq&nbsp;m
                  </p>
                  <p className="text-2xl font-semibold text-zinc-900 tabular-nums">
                    &euro;{fmtCurrency(valuation.adopted_rate_per_sqm)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">
                    Comparables Used
                  </p>
                  <p className="text-2xl font-semibold text-zinc-900 tabular-nums">
                    {comparableCount}
                  </p>
                </div>
              </div>

              {property?.gross_internal_area != null && (
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <p className="text-xs text-zinc-400 mb-1">
                    Implied Valuation
                  </p>
                  <p className="text-4xl font-bold text-zinc-900 tabular-nums">
                    &euro;
                    {fmtCurrency(
                      valuation.adopted_rate_per_sqm *
                        Number(property.gross_internal_area)
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {fmtCurrency(valuation.adopted_rate_per_sqm)} &times;{" "}
                    {Number(property.gross_internal_area).toLocaleString(
                      "en-IE"
                    )}{" "}
                    sq&nbsp;m
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState message="No valuation conclusion has been recorded yet." />
          )}
        </section>

        {/* Section 5: Rationale */}
        <section>
          <SectionHeading number={5} title="Rationale" />
          {valuation?.adopted_rate_rationale ? (
            <div className={`${card} px-6 py-5`}>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {valuation.adopted_rate_rationale}
              </p>
            </div>
          ) : (
            <EmptyState message="No rationale has been provided yet." />
          )}
        </section>

        {/* Section 6: Assumptions */}
        <section>
          <SectionHeading number={6} title="Assumptions" />
          {valuation?.assumptions ? (
            <div className={`${card} px-6 py-5`}>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {valuation.assumptions}
              </p>
            </div>
          ) : (
            <EmptyState message="No assumptions have been recorded." />
          )}
        </section>

        {/* Section 7: Limiting Conditions */}
        <section>
          <SectionHeading number={7} title="Limiting Conditions" />
          {valuation?.limiting_conditions ? (
            <div className={`${card} px-6 py-5`}>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {valuation.limiting_conditions}
              </p>
            </div>
          ) : (
            <EmptyState message="No limiting conditions have been recorded." />
          )}
        </section>

        {/* Section 8: Valuer Declaration */}
        <section>
          <SectionHeading number={8} title="Valuer Declaration" />
          <div className={`${card} px-6 py-5`}>
            <p className="text-sm text-zinc-600 leading-relaxed italic mb-6">
              &ldquo;I confirm that this valuation has been prepared in
              accordance with RICS standards and reflects my professional
              judgement. I have no conflict of interest in this
              instruction.&rdquo;
            </p>
            <dl>
              <FieldRow label="Valuer Name" value={valuation?.valuer_name} />
              <FieldRow
                label="Report Date"
                value={fmtDate(new Date().toISOString())}
              />
            </dl>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-zinc-100 text-center">
        <p className="text-xs text-zinc-400">
          Draft Valuation Report &middot; Generated by RedBook Pro
        </p>
        <p className="text-xs text-zinc-300 mt-1">
          This is not a RICS-compliant valuation report. For professional use only.
        </p>
      </div>
      </div>

      {/* ── Validation Agent — separate from report ── */}
      <div className="xl:sticky xl:top-24">
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2 mb-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <h3 className="text-sm font-semibold text-zinc-900">Validation Agent</h3>
            </div>
            <p className="text-xs text-zinc-400">
              RICS Red Book Global Standards 2024 — run manually before finalising
            </p>
          </div>
          <div className="px-5 py-4">
            <ValidationPanel caseId={id} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
