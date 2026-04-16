"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FACTOR_OPTIONS, type Adjustment } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";
import {
  inputClass,
  inputErrorClass,
  inputFilledClass,
  btnPrimary,
  btnSecondary,
  btnDashed,
  btnRemove,
  card,
  labelClass,
  overline,
} from "@/lib/styles";

const TRANSACTION_TYPE_OPTIONS = [
  "Sale",
  "Letting",
  "Rent Review",
  "Lease Renewal",
];

function emptyAdjustment(): Adjustment {
  return { factor: "location", percentage: 0, rationale: "" };
}

const URL_PATTERN = /^https?:\/\/\S+$/i;

const PROPERTY_TYPE_KEYWORDS = [
  "office",
  "retail",
  "industrial",
  "warehouse",
  "restaurant",
  "mixed use",
  "mixed-use",
  "apartment",
  "residential",
  "hotel",
  "pub",
  "shop",
  "showroom",
  "clinic",
  "crèche",
  "creche",
] as const;

interface ParseResult {
  urlOnly: boolean;
  address: string;
  price: string;
  area: string;
  propertyType: string;
  transactionType: string;
}

const ADDRESS_NOISE = [
  /\b(is\s+)?for\s+sale\b/gi,
  /\bto\s+(let|rent)\b/gi,
  /\bon\s+(Daft\.ie|MyHome\.ie|PropertyPal|Lisney|CBRE|BNP|JLL|Savills|Allsop)\b/gi,
  /\b(Sale Agreed|Price on Application|POA)\b/gi,
];

function cleanAddress(raw: string): string {
  let addr = raw;
  for (const re of ADDRESS_NOISE) {
    addr = addr.replace(re, "");
  }
  return addr
    .replace(/\s*[,\-–|]\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function inferTransactionType(text: string): string {
  const lower = text.toLowerCase();
  if (/\bfor\s+sale\b/.test(lower) || /\bsale\s+agreed\b/.test(lower)) return "Sale";
  if (/\bto\s+(let|rent)\b/.test(lower) || /\bfor\s+rent\b/.test(lower)) return "Letting";
  return "";
}

function isUrlLine(line: string): boolean {
  return /https?:\/\//i.test(line);
}

function parseListingText(text: string): ParseResult {
  const result: ParseResult = {
    urlOnly: false,
    address: "",
    price: "",
    area: "",
    propertyType: "",
    transactionType: "",
  };

  const trimmed = text.trim();
  if (!trimmed) return result;

  if (URL_PATTERN.test(trimmed)) {
    result.urlOnly = true;
    return result;
  }

  const priceMatch = trimmed.match(/€\s?([\d,]+(?:\.\d+)?)/);
  if (priceMatch) {
    result.price = priceMatch[1].replace(/,/g, "");
  }

  const sqmMatch = trimmed.match(
    /([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*m|m²|sqm)/i
  );
  if (sqmMatch) {
    result.area = sqmMatch[1].replace(/,/g, "");
  } else {
    const sqftMatch = trimmed.match(
      /([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*ft|ft²|sqft)/i
    );
    if (sqftMatch) {
      const sqft = parseFloat(sqftMatch[1].replace(/,/g, ""));
      if (!isNaN(sqft)) result.area = (sqft * 0.092903).toFixed(2);
    }
  }

  const lower = trimmed.toLowerCase();
  for (const kw of PROPERTY_TYPE_KEYWORDS) {
    if (lower.includes(kw)) {
      result.propertyType = kw.charAt(0).toUpperCase() + kw.slice(1);
      break;
    }
  }

  result.transactionType = inferTransactionType(trimmed);

  const lines = trimmed
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (isUrlLine(line)) continue;
    if (/€/.test(line)) continue;
    if (/^\d[\d,.]*$/.test(line)) continue;
    if (/^(bed|bath|ber|energy|floor|size|type|price)/i.test(line)) continue;
    if (line.length < 8) continue;
    if (line.length > 200) continue;
    result.address = cleanAddress(line);
    break;
  }

  return result;
}

export interface ExistingComparable {
  address: string;
  price_or_rent: number;
  gross_internal_area: number;
}

export default function ComparableForm({
  action,
  redirectStep,
  existingComparables = [],
  justAdded = false,
  defaultTransactionType = "",
}: {
  action: (formData: FormData) => void;
  redirectStep?: string;
  existingComparables?: ExistingComparable[];
  justAdded?: boolean;
  defaultTransactionType?: string;
}) {
  const [pasteText, setPasteText] = useState("");
  const [extractMsg, setExtractMsg] = useState<{
    type: "success" | "warning";
    text: string;
  } | null>(null);
  const [address, setAddress] = useState("");
  const [priceOrRent, setPriceOrRent] = useState("");
  const [area, setArea] = useState("");
  const [transactionType, setTransactionType] = useState(defaultTransactionType);
  const [transactionDate, setTransactionDate] = useState("");
  const [dateEstimated, setDateEstimated] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [filledFields, setFilledFields] = useState<Set<string>>(new Set());
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [showAdded, setShowAdded] = useState(justAdded);
  const [pprLoading, setPprLoading] = useState(false);
  const [pprResults, setPprResults] = useState<Array<{
    id: string;
    sale_date: string;
    address: string;
    county: string | null;
    price: number;
    description: string | null;
  }>>([]);
  const [pprError, setPprError] = useState<string | null>(null);
  const [pprUsed, setPprUsed] = useState(false);
  const [searchMode, setSearchMode] = useState<"address" | "area">("address");
  const [areaQuery, setAreaQuery] = useState("");
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaResults, setAreaResults] = useState<Array<{
    id: string;
    sale_date: string;
    address: string;
    county: string | null;
    price: number;
    description: string | null;
    distance_km: number;
  }>>([]);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const skipDuplicateCheck = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const handlePprSearch = useCallback(async () => {
    const searchAddress = address.trim();
    // #region agent log
    fetch('http://127.0.0.1:7753/ingest/fe992d52-33c9-4a9f-ad9d-1d5e5b991e5e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'17e22d'},body:JSON.stringify({sessionId:'17e22d',location:'ComparableForm.tsx:handlePprSearch',message:'handlePprSearch called',data:{searchAddress,len:searchAddress.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (!searchAddress || searchAddress.length < 6) {
      // #region agent log
      fetch('http://127.0.0.1:7753/ingest/fe992d52-33c9-4a9f-ad9d-1d5e5b991e5e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'17e22d'},body:JSON.stringify({sessionId:'17e22d',location:'ComparableForm.tsx:handlePprSearch:earlyReturn',message:'early return - address too short',data:{searchAddress,len:searchAddress.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setPprResults([]);
      setPprError(null);
      return;
    }
    setPprLoading(true);
    setPprError(null);
    setPprResults([]);
    try {
      const res = await fetch("/api/ppr/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: searchAddress }),
      });
      const json = await res.json();
      // #region agent log
      fetch('http://127.0.0.1:7753/ingest/fe992d52-33c9-4a9f-ad9d-1d5e5b991e5e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'17e22d'},body:JSON.stringify({sessionId:'17e22d',location:'ComparableForm.tsx:handlePprSearch:response',message:'PPR fetch response',data:{ok:res.ok,status:res.status,json},timestamp:Date.now(),hypothesisId:'H3,H4'})}).catch(()=>{});
      // #endregion
      if (!res.ok || json.error) {
        setPprError(json.error ?? "Search failed.");
        return;
      }
      if (json.results.length === 0) {
        setPprError("No matches found.");
        return;
      }
      setPprResults(json.results);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7753/ingest/fe992d52-33c9-4a9f-ad9d-1d5e5b991e5e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'17e22d'},body:JSON.stringify({sessionId:'17e22d',location:'ComparableForm.tsx:handlePprSearch:catch',message:'PPR fetch error',data:{error:String(err)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      setPprError("Search failed. Check your connection.");
    } finally {
      setPprLoading(false);
    }
  }, [address]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7753/ingest/fe992d52-33c9-4a9f-ad9d-1d5e5b991e5e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'17e22d'},body:JSON.stringify({sessionId:'17e22d',location:'ComparableForm.tsx:useEffect',message:'useEffect fired',data:{address,trimmedLen:address.trim().length},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    if (address.trim().length < 6) {
      setPprResults([]);
      setPprError(null);
      return;
    }
    const timer = setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7753/ingest/fe992d52-33c9-4a9f-ad9d-1d5e5b991e5e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'17e22d'},body:JSON.stringify({sessionId:'17e22d',location:'ComparableForm.tsx:useEffect:timeout',message:'setTimeout fired, calling handlePprSearch',data:{address},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      handlePprSearch();
    }, 400);
    return () => clearTimeout(timer);
  }, [address, handlePprSearch]);

  async function handleAreaSearch() {
    if (!areaQuery.trim() || areaQuery.trim().length < 3) return;
    setAreaLoading(true);
    setAreaError(null);
    setAreaResults([]);
    setAreaName(null);
    try {
      const res = await fetch("/api/ppr/area-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: areaQuery.trim(),
          radiusKm: 1.5,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setAreaError(json.error ?? "Search failed.");
        return;
      }
      if (json.results.length === 0) {
        setAreaError(
          "No PPR sales found in this area. " +
          "Try a nearby town or increase the search radius."
        );
        return;
      }
      setAreaResults(json.results);
      setAreaName(json.area ?? null);
    } catch {
      setAreaError("Search failed. Check your connection.");
    } finally {
      setAreaLoading(false);
    }
  }

  function applyAreaResult(result: {
    sale_date: string;
    address: string;
    price: number;
  }) {
    setAddress(result.address);
    setPriceOrRent(String(result.price));
    setTransactionDate(result.sale_date);
    setTransactionType("Sale");
    setDateEstimated(false);
    setAreaResults([]);
    setPprUsed(true);
    setFilledFields((s) => {
      const n = new Set(s);
      n.add("address");
      n.add("price");
      n.add("transactionDate");
      n.add("transactionType");
      return n;
    });
    setSearchMode("address");
  }

  function applyExtracted(extracted: {
    address?: string;
    price?: string;
    area?: string;
    propertyType?: string;
    transactionType?: string;
  }) {
    const filled = new Set<string>();

    if (extracted.address) { setAddress(extracted.address); filled.add("address"); }
    if (extracted.price) { setPriceOrRent(extracted.price); filled.add("price"); }
    if (extracted.area) { setArea(extracted.area); filled.add("area"); }
    if (extracted.transactionType) { setTransactionType(extracted.transactionType); filled.add("transactionType"); }

    setFilledFields(filled);

    if (filled.size > 0) {
      if (!transactionDate) {
        setTransactionDate(new Date().toISOString().slice(0, 10));
        setDateEstimated(true);
        filled.add("transactionDate");
      }
      setExtractMsg({
        type: "success",
        text: "Details extracted from listing — review and confirm before saving.",
      });
    } else {
      setExtractMsg({
        type: "warning",
        text: "Could not extract fields. Try pasting more detailed listing text.",
      });
    }
  }

  async function handleUrlImport(url: string) {
    setUrlLoading(true);
    setExtractMsg(null);
    try {
      const res = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        setExtractMsg({
          type: "warning",
          text: "Couldn't extract from this link. Paste the listing text instead.",
        });
        return;
      }
      applyExtracted(json.data);
    } catch {
      setExtractMsg({
        type: "warning",
        text: "Couldn't extract from this link. Paste the listing text instead.",
      });
    } finally {
      setUrlLoading(false);
    }
  }

  function handleExtract() {
    setExtractMsg(null);
    const trimmed = pasteText.trim();

    if (URL_PATTERN.test(trimmed)) {
      handleUrlImport(trimmed);
      return;
    }

    const extracted = parseListingText(pasteText);
    applyExtracted(extracted);
  }

  function applyPprResult(result: {
    sale_date: string;
    address: string;
    price: number;
  }) {
    setAddress(result.address);
    setPriceOrRent(String(result.price));
    setTransactionDate(new Date(result.sale_date).toISOString().slice(0, 10));
    setTransactionType("Sale");
    setDateEstimated(false);
    setPprResults([]);
    setPprUsed(true);
    setFilledFields((s) => {
      const n = new Set(s);
      n.add("address");
      n.add("price");
      n.add("transactionDate");
      n.add("transactionType");
      return n;
    });
  }

  const price = parseFloat(priceOrRent);
  const areaVal = parseFloat(area);
  const ratePreview =
    !isNaN(price) && !isNaN(areaVal) && areaVal > 0 ? price / areaVal : null;

  const totalPct = adjustments.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0
  );
  const adjustedRatePreview =
    ratePreview !== null && adjustments.length > 0
      ? ratePreview * (1 + totalPct / 100)
      : null;

  const hasFieldError = (field: "price" | "area") =>
    errors.some((e) =>
      field === "price" ? e.includes("Price") : e.includes("Area")
    );

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

  function isDuplicate(): boolean {
    const trimmedAddr = address.trim().toLowerCase();
    if (!trimmedAddr || isNaN(price) || isNaN(areaVal)) return false;
    return existingComparables.some(
      (c) =>
        c.address.trim().toLowerCase() === trimmedAddr &&
        Number(c.price_or_rent) === price &&
        Number(c.gross_internal_area) === areaVal
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const newErrors: string[] = [];

    if (!priceOrRent || isNaN(price) || price <= 0) {
      newErrors.push("Price / Rent must be greater than 0.");
    }
    if (!area || isNaN(areaVal) || areaVal <= 0) {
      newErrors.push("Gross Internal Area must be greater than 0.");
    }

    if (newErrors.length > 0) {
      e.preventDefault();
      setErrors(newErrors);
      setDuplicateWarning(false);
      return;
    }

    if (skipDuplicateCheck.current) {
      skipDuplicateCheck.current = false;
    } else if (isDuplicate()) {
      e.preventDefault();
      setErrors([]);
      setDuplicateWarning(true);
      return;
    }

    setErrors([]);
    setDuplicateWarning(false);
    setPprResults([]);
    setPprUsed(false);
    setPprError(null);
  }

  function forceSubmit() {
    skipDuplicateCheck.current = true;
    setDuplicateWarning(false);
    formRef.current?.requestSubmit();
  }

  return (
    <div>
      {showAdded && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-sm font-medium">&#10003;</span>
            <span className="text-sm text-emerald-800">
              Comparable added successfully
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAdded(false)}
            className="text-emerald-400 hover:text-emerald-600 text-sm leading-none"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      <form
        ref={formRef}
        id="comparable-form"
        action={action}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {redirectStep && <input type="hidden" name="_step" value={redirectStep} />}

        {/* Paste + Extract */}
        <div className="rounded-lg bg-zinc-50 p-4">
          <label htmlFor="paste_listing" className={labelClass}>
            Paste listing text or URL
          </label>
          <textarea
            ref={pasteRef}
            id="paste_listing"
            rows={2}
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.target.value);
              if (extractMsg) setExtractMsg(null);
              if (showAdded) setShowAdded(false);
            }}
            placeholder="Paste from Daft, BidX1, or any listing — URL or text"
            className={inputClass + " resize-y"}
            autoFocus={justAdded}
          />
          <button
            type="button"
            onClick={handleExtract}
            disabled={!pasteText.trim() || urlLoading}
            className={btnSecondary + " mt-2"}
          >
            {urlLoading ? "Importing…" : "Extract Details"}
          </button>
          {extractMsg && (
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                extractMsg.type === "warning"
                  ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/60"
                  : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60"
              }`}
            >
              {extractMsg.text}
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl bg-red-50/80 px-4 py-3 ring-1 ring-red-200/60">
            <ul className="space-y-1">
              {errors.map((err) => (
                <li
                  key={err}
                  className="flex items-center gap-2 text-sm text-red-700"
                >
                  <span className="text-red-400">&#10005;</span>
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fields — compact grid for core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit mb-4">
              <button
                type="button"
                onClick={() => {
                  setSearchMode("address");
                  setAreaResults([]);
                  setAreaError(null);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  searchMode === "address"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Known address
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode("area");
                  setPprResults([]);
                  setPprError(null);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  searchMode === "area"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Browse area sales
              </button>
            </div>
          </div>

          {searchMode === "area" && (
            <div className="sm:col-span-2">
              <label className={labelClass}>
                <span>Search Area</span>
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/20 rounded-full px-2 py-0.5">
                  PPR Smart Search
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAreaSearch();
                    }
                  }}
                  placeholder="e.g. Salthill, Galway"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleAreaSearch}
                  disabled={areaLoading || areaQuery.trim().length < 3}
                  className={btnSecondary}
                >
                  {areaLoading ? "Searching..." : "Search"}
                </button>
              </div>

              {areaLoading && (
                <div className="mt-2 flex items-center gap-2.5 bg-emerald-50 rounded-lg px-3 py-2 ring-1 ring-emerald-200/60">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-700 font-medium">
                    Searching Property Price Register...
                  </span>
                </div>
              )}

              {areaError && (
                <p className="mt-2 text-xs text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2 ring-1 ring-zinc-200/60">
                  {areaError}
                </p>
              )}

              {areaResults.length > 0 && (
                <div className="mt-3 border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
                    <p className="text-xs font-medium text-zinc-700">
                      {areaResults.length} recent sales near{" "}
                      {areaQuery} — click to use as comparable
                    </p>
                  </div>
                  <ul className="divide-y divide-zinc-50 max-h-80 overflow-y-auto">
                    {areaResults.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => applyAreaResult(r)}
                          className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">
                                {r.address}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {r.county}
                                {r.description ? " · " + r.description : ""}
                                {" · "}
                                <span className="text-zinc-400">
                                  {r.distance_km.toFixed(2)}km away
                                </span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                                €{Number(r.price).toLocaleString("en-IE")}
                              </p>
                              <p className="text-xs text-zinc-500 tabular-nums">
                                {new Date(r.sale_date).toLocaleDateString("en-IE", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {searchMode === "address" && (
          <div className="sm:col-span-2">
            <label htmlFor="comp_address" className={labelClass}>
              <span>Address</span>
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/20 rounded-full px-2 py-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                PPR Smart Search
              </span>
            </label>
            <input
              type="text"
              id="comp_address"
              name="address"
              required
              value={address}
              onChange={(e) => { setAddress(e.target.value); if (duplicateWarning) setDuplicateWarning(false); setFilledFields((s) => { const n = new Set(s); n.delete("address"); return n; }); setPprResults([]); setPprUsed(false); }}
              className={filledFields.has("address") ? inputFilledClass : inputClass}
            />

            {pprLoading && (
              <div className="mt-2 flex items-center gap-2.5 bg-emerald-50 rounded-lg px-3 py-2 ring-1 ring-emerald-200/60">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-700 font-medium">
                  Searching 779,000+ Irish property transactions...
                </span>
              </div>
            )}

            {pprError && address.trim().length >= 6 && (
              <p className="mt-2 text-xs text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2 ring-1 ring-zinc-200/60">
                No PPR records found for this address. The property may not have sold since 2010, or try shortening the address.
              </p>
            )}

            {pprUsed && (
              <div className="mt-2 flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 ring-1 ring-emerald-200/60">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                <p className="text-xs font-medium text-emerald-700">
                  Verified from the Property Price Register
                </p>
              </div>
            )}

            {pprResults.length > 0 && (
              <div className="mt-1.5 border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-lg z-10 relative">
                <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <p className="text-xs font-medium text-zinc-700">
                      Property Price Register matches
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPprResults([])}
                    className="text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    Dismiss
                  </button>
                </div>
                <ul className="divide-y divide-zinc-50 max-h-64 overflow-y-auto">
                  {pprResults.map((r, index) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => applyPprResult(r)}
                        className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-zinc-900 truncate">
                                {r.address}
                              </p>
                              {index === 0 && (
                                <span className="shrink-0 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 rounded-full px-2 py-0.5">
                                  Most recent
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {r.county}
                              {r.description ? " · " + r.description : ""}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                              €{Number(r.price).toLocaleString("en-IE")}
                            </p>
                            <p className="text-xs text-zinc-500 tabular-nums">
                              {new Date(r.sale_date).toLocaleDateString(
                                "en-IE",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          )}

          <div>
            <label htmlFor="transaction_type" className={labelClass}>
              Transaction Type
            </label>
            <select
              id="transaction_type"
              name="transaction_type"
              required
              value={transactionType}
              onChange={(e) => { setTransactionType(e.target.value); setFilledFields((s) => { const n = new Set(s); n.delete("transactionType"); return n; }); }}
              className={filledFields.has("transactionType") ? inputFilledClass : inputClass}
            >
              <option value="">Select type...</option>
              {TRANSACTION_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="transaction_date" className={labelClass}>
              Transaction Date
            </label>
            <input
              type="date"
              id="transaction_date"
              name="transaction_date"
              required
              value={transactionDate}
              onChange={(e) => { setTransactionDate(e.target.value); setDateEstimated(false); setFilledFields((s) => { const n = new Set(s); n.delete("transactionDate"); return n; }); }}
              className={filledFields.has("transactionDate") ? inputFilledClass : inputClass}
            />
            {dateEstimated && (
              <p className="mt-1 text-xs text-amber-600">
                Date estimated — confirm before saving
              </p>
            )}
          </div>

          <div>
            <label htmlFor="price_or_rent" className={labelClass}>
              Price / Rent (&euro;)
            </label>
            <input
              type="number"
              id="price_or_rent"
              name="price_or_rent"
              required
              step="0.01"
              min="0.01"
              value={priceOrRent}
              onChange={(e) => {
                setPriceOrRent(e.target.value);
                if (errors.length > 0) setErrors([]);
                if (duplicateWarning) setDuplicateWarning(false);
                setFilledFields((s) => { const n = new Set(s); n.delete("price"); return n; });
              }}
              className={hasFieldError("price") ? inputErrorClass : filledFields.has("price") ? inputFilledClass : inputClass}
            />
          </div>

          <div>
            <label htmlFor="comp_gross_internal_area" className={labelClass}>
              Area (sq m)
            </label>
            <input
              type="number"
              id="comp_gross_internal_area"
              name="gross_internal_area"
              required
              step="0.01"
              min="0.01"
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                if (errors.length > 0) setErrors([]);
                if (duplicateWarning) setDuplicateWarning(false);
                setFilledFields((s) => { const n = new Set(s); n.delete("area"); return n; });
              }}
              className={hasFieldError("area") ? inputErrorClass : filledFields.has("area") ? inputFilledClass : inputClass}
            />
          </div>
        </div>

        {ratePreview !== null && (
          <div
            className={`rounded-lg px-3.5 py-2.5 ${
              ratePreview < 500
                ? "bg-amber-50 ring-1 ring-amber-200/60"
                : ratePreview > 10000
                  ? "bg-amber-50 ring-1 ring-amber-200/60"
                  : "bg-zinc-50"
            }`}
          >
            <span className="text-sm text-zinc-500">
              Rate:{" "}
              <span className="font-semibold text-zinc-900">
                &euro;{fmtCurrency(ratePreview)}/sq m
              </span>
            </span>
            {ratePreview < 500 && (
              <p className="mt-1 text-xs text-amber-700">
                Rate appears unusually low — check inputs
              </p>
            )}
            {ratePreview > 10000 && (
              <p className="mt-1 text-xs text-amber-700">
                Rate appears unusually high — check inputs
              </p>
            )}
          </div>
        )}

        {/* Inline Adjustments */}
        <div className="border-t border-zinc-100 pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className={overline}>Adjustments</h4>
            <span className="text-xs text-zinc-300">Optional</span>
          </div>

          {adjustments.length > 0 && (
            <div className="space-y-2 mb-3">
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
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setAdjustments([...adjustments, emptyAdjustment()])
            }
            className={btnDashed}
          >
            + Add adjustment
          </button>

          {adjustments.length > 0 && ratePreview !== null && (
            <div
              className={`mt-3 text-sm ${card} px-3.5 py-2.5 flex justify-between items-center`}
            >
              <span className="text-zinc-500">
                Total: {totalPct >= 0 ? "+" : ""}
                {totalPct.toFixed(1)}%
              </span>
              <span className="font-semibold text-zinc-900 tabular-nums">
                Adjusted: &euro;{fmtCurrency(adjustedRatePreview!)}/sq m
              </span>
            </div>
          )}
        </div>

        <input
          type="hidden"
          name="adjustments_json"
          value={JSON.stringify(adjustments)}
        />

        {duplicateWarning && (
          <div className="rounded-xl bg-amber-50/80 px-4 py-3 ring-1 ring-amber-200/60">
            <p className="text-sm font-medium text-amber-800">
              This looks like a duplicate comparable.
            </p>
            <p className="text-sm text-amber-700 mt-1">
              A comparable with the same address, price, and area already exists.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={forceSubmit}
                className={btnPrimary}
              >
                Add Anyway
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(false)}
                className={btnSecondary}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!duplicateWarning && (
          <div className="pt-1">
            <button type="submit" className={btnPrimary}>
              Add Comparable
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
