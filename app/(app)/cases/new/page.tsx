import Link from "next/link";
import { createCase } from "@/app/actions";
import { inputClass, btnPrimary, labelClass } from "@/lib/styles";

const WORKFLOW_STEPS = ["Case details", "Evidence", "Analysis", "Report"];

export default function NewCasePage() {
  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-16 items-start">

        {/* ── Left: Editorial column ── */}
        <div className="lg:pt-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
            New Case
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-3 leading-snug">
            Start a valuation
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            Define the instruction. Evidence, analysis, and the draft report follow inside the workspace.
          </p>

          {/* Workflow preview */}
          <div className="space-y-1.5">
            {WORKFLOW_STEPS.map((step, i) => {
              const isActive = i === 0;
              return (
                <div key={step} className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-zinc-900" : "bg-zinc-200"}`} />
                  <span className={`text-sm ${isActive ? "text-zinc-900 font-medium" : "text-zinc-300"}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Form card ── */}
        <div className="bg-white border border-zinc-200 rounded-xl p-7">
          <form action={createCase} className="space-y-5">

            <div>
              <label htmlFor="client_name" className={labelClass}>
                Client Name
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                required
                autoFocus
                placeholder="e.g. AIB Bank plc"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="property_address" className={labelClass}>
                Property Address
              </label>
              <input
                type="text"
                id="property_address"
                name="property_address"
                required
                placeholder="e.g. 14 Merrion Square, Dublin 2"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="valuation_date" className={labelClass}>
                  Valuation Date
                </label>
                <input
                  type="date"
                  id="valuation_date"
                  name="valuation_date"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="purpose" className={labelClass}>
                  Purpose
                </label>
                <select id="purpose" name="purpose" required className={inputClass}>
                  <option value="">Select…</option>
                  <option value="Secured Lending">Secured Lending</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Sale">Sale</option>
                  <option value="Financial Reporting">Financial Reporting</option>
                  <option value="Tax / CGT">Tax / CGT</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Probate">Probate</option>
                  <option value="Litigation">Litigation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="basis_of_value" className={labelClass}>
                Basis of Value
              </label>
              <select
                id="basis_of_value"
                name="basis_of_value"
                required
                className={inputClass}
              >
                <option value="">Select…</option>
                <option value="Market Value">Market Value</option>
                <option value="Market Rent">Market Rent</option>
                <option value="Fair Value">Fair Value</option>
                <option value="Investment Value">Investment Value</option>
                <option value="Existing Use Value">Existing Use Value</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <button type="submit" className={btnPrimary}>
                Create Case →
              </button>
              <Link
                href="/"
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Cancel
              </Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
