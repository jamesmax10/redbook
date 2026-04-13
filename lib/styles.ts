/**
 * Shared design tokens used across every page and component.
 * Single source of truth — edit here, every surface updates.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
export const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300";

export const inputErrorClass =
  "w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400";

export const inputFilledClass =
  "w-full rounded-lg border border-emerald-300 bg-emerald-50/30 px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400";

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
export const btnPrimary =
  "inline-flex items-center justify-center bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed";

export const btnSecondary =
  "inline-flex items-center justify-center bg-white text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-zinc-950/5 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed";

export const btnDashed =
  "text-xs text-zinc-400 hover:text-zinc-700 border border-dashed border-zinc-200 rounded-lg px-3 py-1.5 w-full transition-colors";

export const btnRemove =
  "text-zinc-300 hover:text-red-500 text-lg leading-none pt-2 transition-colors";

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------
export const card =
  "bg-white rounded-xl ring-1 ring-zinc-950/5 shadow-sm";

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const pageTitle =
  "text-2xl font-semibold tracking-tight text-zinc-900";

export const sectionTitle =
  "text-base font-semibold text-zinc-900";

export const overline =
  "text-xs font-medium text-zinc-400 uppercase tracking-wider";

export const labelClass =
  "block text-sm font-medium text-zinc-700 mb-1.5";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
export const backLink =
  "text-sm text-zinc-400 hover:text-zinc-700 transition-colors";

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
export const thClass =
  "text-xs font-medium text-zinc-400 uppercase tracking-wider";

export const tdBase =
  "px-5 py-3.5";

export const trHover =
  "hover:bg-zinc-50/50 transition-colors";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export const alertSuccess =
  "rounded-xl px-5 py-4 flex items-center gap-3 bg-emerald-50/80 ring-1 ring-emerald-200/60";

export const alertWarning =
  "rounded-xl px-5 py-4 flex items-center gap-3 bg-amber-50/80 ring-1 ring-amber-200/60";

export const alertError =
  "rounded-xl px-5 py-4 flex items-center gap-3 bg-red-50/80 ring-1 ring-red-200/60";
