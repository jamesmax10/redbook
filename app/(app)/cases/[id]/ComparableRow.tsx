"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { saveAdjustments, updateComparable } from "@/app/actions";
import { FACTOR_OPTIONS, type Adjustment } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDashed,
  btnRemove,
  card,
} from "@/lib/styles";
import DeleteComparableButton from "./DeleteComparableButton";
import {
  TRANSACTION_TYPE_OPTIONS,
  emptyAdjustment,
} from "@/lib/adjustmentHelpers";

interface ComparableData {
  id: string;
  address: string;
  transaction_type: string;
  transaction_date: string;
  price_or_rent: number;
  gross_internal_area: number;
  rate_per_sqm: number;
  adjustments: Adjustment[] | null;
  adjusted_rate_per_sqm: number | null;
}

interface Props {
  comp: ComparableData;
  caseId: string;
  redirectStep?: string;
}

function fmtShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IE", {
    month: "short",
    year: "numeric",
  });
}

export default function ComparableRow({ comp, caseId, redirectStep }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    comp.adjustments ?? []
  );
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [editAddress, setEditAddress] = useState(comp.address);
  const [editTransactionType, setEditTransactionType] = useState(comp.transaction_type);
  const [editTransactionDate, setEditTransactionDate] = useState(comp.transaction_date);
  const [editPrice, setEditPrice] = useState(String(comp.price_or_rent));
  const [editArea, setEditArea] = useState(String(comp.gross_internal_area));
  const [editAdjustments, setEditAdjustments] = useState<Adjustment[]>(
    comp.adjustments ?? []
  );
  const [editErrors, setEditErrors] = useState<string[]>([]);

  useEffect(() => {
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, []);

  const totalPct = adjustments.reduce((sum, a) => sum + (a.percentage || 0), 0);
  const liveAdjustedRate = Number(comp.rate_per_sqm) * (1 + totalPct / 100);
  const isDirty = JSON.stringify(adjustments) !== JSON.stringify(comp.adjustments ?? []);

  const effectiveRate = comp.adjusted_rate_per_sqm ?? Number(comp.rate_per_sqm);
  const isAdjusted = comp.adjusted_rate_per_sqm != null &&
    comp.adjusted_rate_per_sqm !== Number(comp.rate_per_sqm);
  const deltaPct = isAdjusted
    ? ((comp.adjusted_rate_per_sqm! - comp.rate_per_sqm) / comp.rate_per_sqm) * 100
    : null;

  const editPriceNum = parseFloat(editPrice);
  const editAreaNum = parseFloat(editArea);
  const editRatePreview =
    !isNaN(editPriceNum) && !isNaN(editAreaNum) && editAreaNum > 0
      ? editPriceNum / editAreaNum
      : null;
  const editTotalPct = editAdjustments.reduce((sum, a) => sum + (a.percentage || 0), 0);
  const editAdjustedPreview =
    editRatePreview !== null && editAdjustments.length > 0
      ? editRatePreview * (1 + editTotalPct / 100)
      : null;

  function updateAdjustment(index: number, field: keyof Adjustment, value: string | number) {
    setAdjustments((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }
  function removeAdjustment(index: number) {
    setAdjustments((prev) => prev.filter((_, i) => i !== index));
  }
  function updateEditAdjustment(index: number, field: keyof Adjustment, value: string | number) {
    setEditAdjustments((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }
  function removeEditAdjustment(index: number) {
    setEditAdjustments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    startTransition(() => { saveAdjustments(comp.id, caseId, adjustments, redirectStep); });
  }

  function startEditing() {
    setEditAddress(comp.address);
    setEditTransactionType(comp.transaction_type);
    setEditTransactionDate(comp.transaction_date);
    setEditPrice(String(comp.price_or_rent));
    setEditArea(String(comp.gross_internal_area));
    setEditAdjustments(comp.adjustments ? [...comp.adjustments] : []);
    setEditErrors([]);
    setEditing(true);
    setExpanded(false);
  }

  function cancelEditing() {
    setEditing(false);
    setEditErrors([]);
  }

  function handleEditSave() {
    const errors: string[] = [];
    if (!editAddress.trim()) errors.push("Address is required.");
    if (!editTransactionType) errors.push("Transaction type is required.");
    if (!editTransactionDate) errors.push("Transaction date is required.");
    if (isNaN(editPriceNum) || editPriceNum <= 0) errors.push("Price / Rent must be greater than 0.");
    if (isNaN(editAreaNum) || editAreaNum <= 0) errors.push("Gross Internal Area must be greater than 0.");
    if (errors.length > 0) { setEditErrors(errors); return; }

    const formData = new FormData();
    formData.set("address", editAddress.trim());
    formData.set("transaction_type", editTransactionType);
    formData.set("transaction_date", editTransactionDate);
    formData.set("price_or_rent", editPrice);
    formData.set("gross_internal_area", editArea);
    formData.set("adjustments_json", JSON.stringify(editAdjustments));
    if (redirectStep) formData.set("_step", redirectStep);

    startTransition(async () => {
      const result = await updateComparable(comp.id, caseId, formData);
      if (result.success) {
        setEditing(false);
        setEditErrors([]);
        setAdjustments(editAdjustments);
        setSuccessMsg("Updated");
        if (successTimer.current) clearTimeout(successTimer.current);
        successTimer.current = setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setEditErrors([result.error]);
      }
    });
  }

  return (
    <div className={`bg-white border rounded-xl transition-all ${editing ? "border-zinc-300 shadow-sm" : "border-zinc-200 hover:border-zinc-300"}`}>
      {successMsg && (
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {successMsg}
          </div>
        </div>
      )}

      {/* ── Compact collapsed row — all signal visible without expanding ── */}
      <div className="flex items-center gap-3 px-4 py-3 min-h-[3rem]">
        {/* Address */}
        <p className="text-sm font-medium text-zinc-900 flex-1 truncate leading-snug min-w-0">
          {comp.address}
        </p>

        {/* Type · Date */}
        <span className="text-xs text-zinc-400 tabular-nums whitespace-nowrap shrink-0 hidden sm:block">
          {comp.transaction_type} · {fmtShortDate(comp.transaction_date)}
        </span>

        {/* Rate display: base → adjusted (or just adjusted if no change) */}
        <div className="shrink-0 text-right">
          <span className="text-sm font-semibold text-zinc-900 tabular-nums">
            €{fmtCurrency(effectiveRate)}/m²
          </span>
          {isAdjusted && (
            <span className="text-xs text-zinc-400 tabular-nums ml-1.5">
              <span className="line-through">€{fmtCurrency(comp.rate_per_sqm)}</span>
            </span>
          )}
        </div>

        {/* Delta */}
        <span className={`shrink-0 text-xs font-medium tabular-nums w-12 text-right ${
          deltaPct != null && deltaPct > 0 ? "text-emerald-600"
            : deltaPct != null && deltaPct < 0 ? "text-red-500"
            : "text-zinc-300"
        }`}>
          {deltaPct != null ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%` : "—"}
        </span>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-0.5">
          <button
            type="button"
            onClick={editing ? cancelEditing : startEditing}
            className="p-1.5 text-zinc-300 hover:text-zinc-600 transition-colors rounded"
            title={editing ? "Cancel" : "Edit"}
          >
            {editing ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            )}
          </button>
          <DeleteComparableButton comparableId={comp.id} caseId={caseId} redirectStep={redirectStep} />
          <button
            type="button"
            onClick={() => { setExpanded(!expanded); setEditing(false); }}
            className="p-1.5 text-zinc-300 hover:text-zinc-600 transition-colors rounded"
            title="View / edit adjustments"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Edit mode ── */}
      {editing && (
        <div className="border-t border-zinc-100 mx-4 mb-4">
          <div className="bg-zinc-50/60 rounded-b-lg px-4 pt-4 pb-4 space-y-4">
            {editErrors.length > 0 && (
              <div className="rounded-xl bg-red-50/80 px-4 py-3 ring-1 ring-red-200/60">
                <ul className="space-y-1">
                  {editErrors.map((err) => (
                    <li key={err} className="flex items-center gap-2 text-sm text-red-700">
                      <span className="text-red-400">&#10005;</span>{err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Address</label>
                <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Transaction Type</label>
                <select value={editTransactionType} onChange={(e) => setEditTransactionType(e.target.value)} className={inputClass}>
                  <option value="">Select type...</option>
                  {TRANSACTION_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Transaction Date</label>
                <input type="date" value={editTransactionDate} onChange={(e) => setEditTransactionDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Price / Rent (€)</label>
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} step="0.01" min="0.01" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Gross Internal Area (sq m)</label>
                <input type="number" value={editArea} onChange={(e) => setEditArea(e.target.value)} step="0.01" min="0.01" className={inputClass} />
              </div>
            </div>

            {editRatePreview !== null && (
              <div className="rounded-lg px-3.5 py-2.5 bg-zinc-100/80 text-sm">
                <span className="text-zinc-500">Rate: <span className="font-semibold text-zinc-900">€{fmtCurrency(editRatePreview)}/m²</span></span>
              </div>
            )}

            <div className="border-t border-zinc-200/60 pt-3">
              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Adjustments</h4>
              {editAdjustments.map((adj, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_1fr_28px] gap-2 items-start mb-2">
                  <select value={adj.factor} onChange={(e) => updateEditAdjustment(i, "factor", e.target.value)} className={inputClass}>
                    {FACTOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input type="number" value={adj.percentage} onChange={(e) => updateEditAdjustment(i, "percentage", parseFloat(e.target.value) || 0)} placeholder="%" step="0.5" className={inputClass + " text-right tabular-nums"} />
                  <input type="text" value={adj.rationale} onChange={(e) => updateEditAdjustment(i, "rationale", e.target.value)} placeholder="Rationale" className={inputClass} />
                  <button type="button" onClick={() => removeEditAdjustment(i)} className={btnRemove} title="Remove">&times;</button>
                </div>
              ))}
              <button type="button" onClick={() => setEditAdjustments([...editAdjustments, emptyAdjustment()])} className={btnDashed}>
                + Add adjustment
              </button>
              {editAdjustments.length > 0 && editRatePreview !== null && (
                <div className={`mt-3 text-sm ${card} px-3.5 py-2.5 flex justify-between items-center`}>
                  <span className="text-zinc-500">Total: {editTotalPct >= 0 ? "+" : ""}{editTotalPct.toFixed(1)}%</span>
                  <span className="font-semibold text-zinc-900 tabular-nums">Adjusted: €{fmtCurrency(editAdjustedPreview!)}/m²</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={handleEditSave} disabled={isPending} className={btnPrimary}>
                {isPending ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={cancelEditing} disabled={isPending} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expanded adjustments (view/quick-edit mode) ── */}
      {expanded && !editing && (
        <div className="border-t border-zinc-100 mx-4 mb-4">
          <div className="bg-zinc-50/60 rounded-b-lg px-4 pt-4 pb-4 space-y-3">
            {adjustments.length === 0 && (
              <p className="text-xs text-zinc-400">No adjustments recorded.</p>
            )}
            {adjustments.map((adj, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_1fr_28px] gap-2 items-start">
                <select value={adj.factor} onChange={(e) => updateAdjustment(i, "factor", e.target.value)} className={inputClass}>
                  {FACTOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input type="number" value={adj.percentage} onChange={(e) => updateAdjustment(i, "percentage", parseFloat(e.target.value) || 0)} placeholder="%" step="0.5" className={inputClass + " text-right tabular-nums"} />
                <input type="text" value={adj.rationale} onChange={(e) => updateAdjustment(i, "rationale", e.target.value)} placeholder="Rationale" className={inputClass} />
                <button type="button" onClick={() => removeAdjustment(i)} className={btnRemove} title="Remove">&times;</button>
              </div>
            ))}

            <button type="button" onClick={() => setAdjustments([...adjustments, emptyAdjustment()])} className={btnDashed}>
              + Add adjustment
            </button>

            {adjustments.length > 0 && (
              <div className={`text-sm ${card} px-3.5 py-2.5 flex justify-between items-center`}>
                <span className="text-zinc-500">Total: {totalPct >= 0 ? "+" : ""}{totalPct.toFixed(1)}%</span>
                <span className="font-semibold text-zinc-900 tabular-nums">
                  Adjusted: €{fmtCurrency(liveAdjustedRate)}/m²
                </span>
              </div>
            )}

            {isDirty && (
              <button type="button" onClick={handleSave} disabled={isPending} className={btnPrimary}>
                {isPending ? "Saving…" : "Save Adjustments"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
