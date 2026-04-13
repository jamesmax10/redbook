"use client";

import { useState, useTransition, useEffect, useRef, Fragment } from "react";
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

const TRANSACTION_TYPE_OPTIONS = [
  "Sale",
  "Letting",
  "Rent Review",
  "Lease Renewal",
];

function emptyAdjustment(): Adjustment {
  return { factor: "location", percentage: 0, rationale: "" };
}

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

export default function ComparableRow({ comp, caseId, redirectStep }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    comp.adjustments ?? []
  );
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout>>();

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

  const totalPct = adjustments.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0
  );
  const liveAdjustedRate = Number(comp.rate_per_sqm) * (1 + totalPct / 100);

  const isDirty =
    JSON.stringify(adjustments) !== JSON.stringify(comp.adjustments ?? []);

  const deltaPct =
    comp.adjusted_rate_per_sqm != null
      ? ((comp.adjusted_rate_per_sqm - comp.rate_per_sqm) /
          comp.rate_per_sqm) *
        100
      : null;

  const adjSummary = comp.adjustments?.length
    ? comp.adjustments
        .map((a) => `${a.percentage >= 0 ? "+" : ""}${a.percentage}%`)
        .join(", ")
    : null;

  // Edit form rate preview
  const editPriceNum = parseFloat(editPrice);
  const editAreaNum = parseFloat(editArea);
  const editRatePreview =
    !isNaN(editPriceNum) && !isNaN(editAreaNum) && editAreaNum > 0
      ? editPriceNum / editAreaNum
      : null;
  const editTotalPct = editAdjustments.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0
  );
  const editAdjustedPreview =
    editRatePreview !== null && editAdjustments.length > 0
      ? editRatePreview * (1 + editTotalPct / 100)
      : null;

  function updateAdjustment(
    index: number,
    field: keyof Adjustment,
    value: string | number
  ) {
    setAdjustments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  function removeAdjustment(index: number) {
    setAdjustments((prev) => prev.filter((_, i) => i !== index));
  }

  function updateEditAdjustment(
    index: number,
    field: keyof Adjustment,
    value: string | number
  ) {
    setEditAdjustments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  function removeEditAdjustment(index: number) {
    setEditAdjustments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    startTransition(() => {
      saveAdjustments(comp.id, caseId, adjustments, redirectStep);
    });
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
    if (isNaN(editPriceNum) || editPriceNum <= 0)
      errors.push("Price / Rent must be greater than 0.");
    if (isNaN(editAreaNum) || editAreaNum <= 0)
      errors.push("Gross Internal Area must be greater than 0.");

    if (errors.length > 0) {
      setEditErrors(errors);
      return;
    }

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
        setSuccessMsg("Comparable updated successfully");
        if (successTimer.current) clearTimeout(successTimer.current);
        successTimer.current = setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setEditErrors([result.error]);
      }
    });
  }

  return (
    <Fragment>
      <tr className="border-b border-zinc-50 last:border-0 align-top hover:bg-zinc-50/50 transition-colors">
        <td className="px-4 py-3.5 font-medium text-zinc-900">
          {comp.address}
        </td>
        <td className="px-4 py-3.5 text-zinc-400">{comp.transaction_type}</td>
        <td className="px-4 py-3.5 text-zinc-400 tabular-nums">
          {comp.transaction_date}
        </td>
        <td className="px-4 py-3.5 text-zinc-500 text-right tabular-nums">
          {"\u20AC"}
          {fmtCurrency(comp.rate_per_sqm)}
        </td>
        <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-zinc-900">
          {"\u20AC"}{fmtCurrency(comp.adjusted_rate_per_sqm ?? comp.rate_per_sqm)}
        </td>
        <td className="px-4 py-3.5 text-right tabular-nums text-zinc-500">
          {deltaPct != null
            ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`
            : "\u2014"}
        </td>
        <td className="px-4 py-3.5 text-xs max-w-[140px]">
          <button
            type="button"
            onClick={() => { setExpanded(!expanded); setEditing(false); }}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <span
              className="inline-block transition-transform text-[10px]"
              style={{
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              &#9654;
            </span>
            <span>{adjSummary ?? "No adjustments"}</span>
          </button>
        </td>
        <td className="px-2 py-3.5 text-center w-8">
          <button
            type="button"
            onClick={editing ? cancelEditing : startEditing}
            className="text-zinc-400 hover:text-zinc-700 text-sm transition-colors"
            title={editing ? "Cancel edit" : "Edit comparable"}
          >
            {editing ? "\u2715" : "\u270E"}
          </button>
        </td>
        <td className="px-2 py-3.5 text-center w-8">
          <DeleteComparableButton comparableId={comp.id} caseId={caseId} redirectStep={redirectStep} />
        </td>
      </tr>

      {successMsg && (
        <tr className="border-b border-zinc-50">
          <td colSpan={9} className="px-4 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50/80 px-3.5 py-2 ring-1 ring-emerald-200/60 text-sm text-emerald-700">
              <span>{"\u2713"}</span>
              <span>{successMsg}</span>
            </div>
          </td>
        </tr>
      )}

      {editing && (
        <tr className="border-b border-zinc-50">
          <td colSpan={9} className="pb-4 pt-1 px-4">
            <div className="bg-zinc-50/80 rounded-lg p-4 space-y-4">
              {editErrors.length > 0 && (
                <div className="rounded-xl bg-red-50/80 px-4 py-3 ring-1 ring-red-200/60">
                  <ul className="space-y-1">
                    {editErrors.map((err) => (
                      <li key={err} className="flex items-center gap-2 text-sm text-red-700">
                        <span className="text-red-400">&#10005;</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Transaction Type</label>
                  <select
                    value={editTransactionType}
                    onChange={(e) => setEditTransactionType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select type...</option>
                    {TRANSACTION_TYPE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Transaction Date</label>
                  <input
                    type="date"
                    value={editTransactionDate}
                    onChange={(e) => setEditTransactionDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Price / Rent ({"\u20AC"})</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    step="0.01"
                    min="0.01"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gross Internal Area (sq m)</label>
                  <input
                    type="number"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    step="0.01"
                    min="0.01"
                    className={inputClass}
                  />
                </div>
              </div>

              {editRatePreview !== null && (
                <div className="rounded-lg px-3.5 py-2.5 bg-zinc-100/80 text-sm">
                  <span className="text-zinc-500">
                    Rate: <span className="font-semibold text-zinc-900">{"\u20AC"}{fmtCurrency(editRatePreview)}/sq m</span>
                  </span>
                </div>
              )}

              {/* Adjustments */}
              <div className="border-t border-zinc-200/60 pt-3">
                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
                  Adjustments
                </h4>

                {editAdjustments.map((adj, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_80px_1fr_28px] gap-2 items-start mb-2"
                  >
                    <select
                      value={adj.factor}
                      onChange={(e) => updateEditAdjustment(i, "factor", e.target.value)}
                      className={inputClass}
                    >
                      {FACTOR_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={adj.percentage}
                      onChange={(e) =>
                        updateEditAdjustment(i, "percentage", parseFloat(e.target.value) || 0)
                      }
                      placeholder="%"
                      step="0.5"
                      className={inputClass + " text-right tabular-nums"}
                    />
                    <input
                      type="text"
                      value={adj.rationale}
                      onChange={(e) => updateEditAdjustment(i, "rationale", e.target.value)}
                      placeholder="Rationale"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeEditAdjustment(i)}
                      className={btnRemove}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setEditAdjustments([...editAdjustments, emptyAdjustment()])}
                  className={btnDashed}
                >
                  + Add adjustment
                </button>

                {editAdjustments.length > 0 && editRatePreview !== null && (
                  <div className={`mt-3 text-sm ${card} px-3.5 py-2.5 flex justify-between items-center`}>
                    <span className="text-zinc-500">
                      Total: {editTotalPct >= 0 ? "+" : ""}{editTotalPct.toFixed(1)}%
                    </span>
                    <span className="font-semibold text-zinc-900 tabular-nums">
                      Adjusted: {"\u20AC"}{fmtCurrency(editAdjustedPreview!)}/sq m
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={isPending}
                  className={btnPrimary}
                >
                  {isPending ? "Saving\u2026" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isPending}
                  className={btnSecondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {expanded && !editing && (
        <tr className="border-b border-zinc-50">
          <td colSpan={9} className="pb-4 pt-1 px-4">
            <div className="bg-zinc-50/80 rounded-lg p-4 space-y-3">
              {adjustments.map((adj, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_80px_1fr_28px] gap-2 items-start"
                >
                  <select
                    value={adj.factor}
                    onChange={(e) =>
                      updateAdjustment(i, "factor", e.target.value)
                    }
                    className={inputClass}
                  >
                    {FACTOR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={adj.percentage}
                    onChange={(e) =>
                      updateAdjustment(
                        i,
                        "percentage",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="%"
                    step="0.5"
                    className={inputClass + " text-right tabular-nums"}
                  />

                  <input
                    type="text"
                    value={adj.rationale}
                    onChange={(e) =>
                      updateAdjustment(i, "rationale", e.target.value)
                    }
                    placeholder="Rationale"
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => removeAdjustment(i)}
                    className={btnRemove}
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setAdjustments([...adjustments, emptyAdjustment()])
                }
                className={btnDashed}
              >
                + Add adjustment
              </button>

              {adjustments.length > 0 && (
                <div
                  className={`text-sm ${card} px-3.5 py-2.5 flex justify-between items-center`}
                >
                  <span className="text-zinc-500">
                    Total: {totalPct >= 0 ? "+" : ""}
                    {totalPct.toFixed(1)}%
                  </span>
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    Adjusted: {"\u20AC"}
                    {fmtCurrency(liveAdjustedRate)}/sq m
                  </span>
                </div>
              )}

              {isDirty && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className={btnPrimary}
                >
                  {isPending ? "Saving\u2026" : "Save Adjustments"}
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
