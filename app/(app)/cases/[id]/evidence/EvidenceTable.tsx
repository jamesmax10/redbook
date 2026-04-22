"use client";

import { useState, useTransition } from "react";
import { deleteComparable, updateComparable } from "@/app/actions";
import { fmtCurrency } from "@/lib/format";
import { FACTOR_OPTIONS, type Adjustment } from "@/lib/types";
import { inputClass, btnPrimary, btnSecondary, btnDashed, btnRemove, labelClass } from "@/lib/styles";
import { TRANSACTION_TYPE_OPTIONS, emptyAdjustment } from "@/lib/adjustmentHelpers";
import ComparableForm from "../ComparableForm";
import type { ComparableRecord } from "./page";

interface Props {
  caseId: string;
  comparables: ComparableRecord[];
  addComparableAction: (formData: FormData) => void;
  existingComparables: { address: string; price_or_rent: number; gross_internal_area: number }[];
}

function fmtShortDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IE", { month: "short", year: "numeric" });
}

function AdjBadge({ comp }: { comp: ComparableRecord }) {
  const isAdjusted = comp.adjusted_rate_per_sqm != null && comp.adjusted_rate_per_sqm !== comp.rate_per_sqm;
  if (!isAdjusted) return <span className="text-zinc-300 text-xs">—</span>;
  const pct = ((comp.adjusted_rate_per_sqm! - comp.rate_per_sqm) / comp.rate_per_sqm) * 100;
  const cls = pct > 0 ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50";
  return (
    <span className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded ${cls}`}>
      {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function EditDrawer({
  comp,
  caseId,
  onClose,
}: {
  comp: ComparableRecord;
  caseId: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editAddress, setEditAddress] = useState(comp.address);
  const [editType, setEditType] = useState(comp.transaction_type);
  const [editDate, setEditDate] = useState(comp.transaction_date);
  const [editPrice, setEditPrice] = useState(String(comp.price_or_rent));
  const [editArea, setEditArea] = useState(String(comp.gross_internal_area));
  const [editAdj, setEditAdj] = useState<Adjustment[]>(comp.adjustments ?? []);
  const [errors, setErrors] = useState<string[]>([]);

  const priceNum = parseFloat(editPrice);
  const areaNum = parseFloat(editArea);
  const ratePreview = !isNaN(priceNum) && !isNaN(areaNum) && areaNum > 0 ? priceNum / areaNum : null;
  const totalPct = editAdj.reduce((s, a) => s + (a.percentage || 0), 0);
  const adjPreview = ratePreview !== null && editAdj.length > 0 ? ratePreview * (1 + totalPct / 100) : null;

  function handleSave() {
    const errs: string[] = [];
    if (!editAddress.trim()) errs.push("Address is required.");
    if (!editType) errs.push("Transaction type is required.");
    if (!editDate) errs.push("Transaction date is required.");
    if (isNaN(priceNum) || priceNum <= 0) errs.push("Price must be greater than 0.");
    if (isNaN(areaNum) || areaNum <= 0) errs.push("Area must be greater than 0.");
    if (errs.length > 0) { setErrors(errs); return; }

    const fd = new FormData();
    fd.set("address", editAddress.trim());
    fd.set("transaction_type", editType);
    fd.set("transaction_date", editDate);
    fd.set("price_or_rent", editPrice);
    fd.set("gross_internal_area", editArea);
    fd.set("adjustments_json", JSON.stringify(editAdj));
    fd.set("_step", "evidence");

    startTransition(async () => {
      const result = await updateComparable(comp.id, caseId, fd);
      if (result.success) {
        onClose();
      } else {
        setErrors([result.error]);
      }
    });
  }

  return (
    <div className="space-y-4 px-6 py-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-zinc-900">Edit Comparable</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 rounded">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 px-4 py-3 ring-1 ring-red-200/60">
          {errors.map((e) => <p key={e} className="text-sm text-red-700">{e}</p>)}
        </div>
      )}

      <div>
        <label className={labelClass}>Address</label>
        <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Transaction Type</label>
          <select value={editType} onChange={(e) => setEditType(e.target.value)} className={inputClass}>
            <option value="">Select...</option>
            {TRANSACTION_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Transaction Date</label>
          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Price / Rent (€)</label>
          <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} step="0.01" min="0.01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Area (m²)</label>
          <input type="number" value={editArea} onChange={(e) => setEditArea(e.target.value)} step="0.01" min="0.01" className={inputClass} />
        </div>
      </div>

      {ratePreview !== null && (
        <div className="rounded-lg bg-zinc-50 px-3.5 py-2.5 text-sm">
          <span className="text-zinc-500">Rate: <span className="font-semibold text-zinc-900">€{fmtCurrency(ratePreview)}/m²</span></span>
        </div>
      )}

      <div className="border-t border-zinc-100 pt-3">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Adjustments</p>
        {editAdj.map((adj, i) => (
          <div key={i} className="grid grid-cols-[1fr_72px_1fr_24px] gap-2 items-start mb-2">
            <select value={adj.factor} onChange={(e) => setEditAdj((p) => p.map((a, j) => j === i ? { ...a, factor: e.target.value } : a))} className={inputClass}>
              {FACTOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input type="number" value={adj.percentage} onChange={(e) => setEditAdj((p) => p.map((a, j) => j === i ? { ...a, percentage: parseFloat(e.target.value) || 0 } : a))} placeholder="%" step="0.5" className={inputClass + " text-right tabular-nums"} />
            <input type="text" value={adj.rationale} onChange={(e) => setEditAdj((p) => p.map((a, j) => j === i ? { ...a, rationale: e.target.value } : a))} placeholder="Rationale" className={inputClass} />
            <button type="button" onClick={() => setEditAdj((p) => p.filter((_, j) => j !== i))} className={btnRemove}>&times;</button>
          </div>
        ))}
        <button type="button" onClick={() => setEditAdj([...editAdj, emptyAdjustment()])} className={btnDashed}>+ Add adjustment</button>
        {editAdj.length > 0 && ratePreview !== null && (
          <div className="mt-2 rounded-lg bg-zinc-50 border border-zinc-100 px-3.5 py-2.5 flex justify-between text-sm">
            <span className="text-zinc-500">Total: {totalPct >= 0 ? "+" : ""}{totalPct.toFixed(1)}%</span>
            <span className="font-semibold text-zinc-900 tabular-nums">€{fmtCurrency(adjPreview!)}/m²</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={handleSave} disabled={isPending} className={btnPrimary}>
          {isPending ? "Saving…" : "Save Changes"}
        </button>
        <button type="button" onClick={onClose} disabled={isPending} className={btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

export default function EvidenceTable({ caseId, comparables, addComparableAction, existingComparables }: Props) {
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
  const [editingComp, setEditingComp] = useState<ComparableRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAdd() { setEditingComp(null); setDrawerMode("add"); }
  function openEdit(comp: ComparableRecord) { setEditingComp(comp); setDrawerMode("edit"); }
  function closeDrawer() { setDrawerMode(null); setEditingComp(null); }

  function handleDelete(compId: string) {
    if (!confirm("Delete this comparable?")) return;
    startTransition(() => { deleteComparable(compId, caseId, "evidence"); });
  }

  const drawerOpen = drawerMode !== null;

  return (
    <div className="relative flex min-h-0">
      {/* Table area */}
      <div className={`flex-1 transition-all duration-200 ${drawerOpen ? "mr-[420px]" : ""}`}>
        {/* Action bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white/80">
          <p className="text-xs text-zinc-400">
            {comparables.length === 0
              ? "No comparables added yet"
              : comparables.length < 2
              ? `${comparables.length} comparable — add at least 1 more`
              : `${comparables.length} comparable${comparables.length === 1 ? "" : "s"}`}
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 bg-zinc-900 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Comparable
          </button>
        </div>

        {comparables.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="border-2 border-dashed border-zinc-200 rounded-xl py-16 px-8">
              <p className="text-sm font-medium text-zinc-500 mb-1">No comparable evidence yet</p>
              <p className="text-xs text-zinc-400 mb-4">Use PPR Smart Search to find and add comparable sales</p>
              <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors">
                + Add First Comparable
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider w-8">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Address</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Area m²</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Rate/m²</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Adj</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-900 uppercase tracking-wider">Adj Rate/m²</th>
                  <th className="w-16 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {comparables.map((comp, idx) => {
                  const effectiveRate = comp.adjusted_rate_per_sqm ?? comp.rate_per_sqm;
                  return (
                    <tr key={comp.id} className="hover:bg-zinc-50/60 transition-colors group">
                      <td className="px-5 py-4 text-xs text-zinc-400 tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-zinc-900 leading-snug block max-w-[260px] truncate">
                          {comp.address}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">
                          {comp.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs text-zinc-400 tabular-nums">
                          {fmtShortDate(comp.transaction_date)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right hidden lg:table-cell">
                        <span className="text-sm text-zinc-600 tabular-nums">€{fmtCurrency(comp.price_or_rent)}</span>
                      </td>
                      <td className="px-4 py-4 text-right hidden lg:table-cell">
                        <span className="text-sm text-zinc-600 tabular-nums">{Number(comp.gross_internal_area).toLocaleString("en-IE")}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm tabular-nums ${comp.adjusted_rate_per_sqm != null ? "text-zinc-400 line-through text-xs" : "text-zinc-700"}`}>
                          €{fmtCurrency(comp.rate_per_sqm)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <AdjBadge comp={comp} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-base font-semibold text-zinc-900 tabular-nums">
                          €{fmtCurrency(effectiveRate)}/m²
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(comp)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors rounded"
                            title="Edit"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(comp.id)}
                            disabled={isPending}
                            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded"
                            title="Delete"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right-side drawer */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px]"
            onClick={closeDrawer}
          />
          {/* Drawer panel */}
          <div className="fixed right-0 top-11 bottom-0 w-[420px] z-30 bg-white border-l border-zinc-200 shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">
                {drawerMode === "add" ? "Add Comparable" : "Edit Comparable"}
              </h2>
              <button onClick={closeDrawer} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {drawerMode === "add" && (
              <div className="px-6 py-5">
                <ComparableForm
                  action={addComparableAction}
                  existingComparables={existingComparables}
                />
              </div>
            )}

            {drawerMode === "edit" && editingComp && (
              <EditDrawer comp={editingComp} caseId={caseId} onClose={closeDrawer} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
