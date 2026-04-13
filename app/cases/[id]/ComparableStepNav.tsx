"use client";

import { useState } from "react";
import Link from "next/link";
import { btnPrimary, btnSecondary, backLink } from "@/lib/styles";

interface Props {
  caseId: string;
  comparableCount: number;
}

export default function ComparableStepNav({ caseId, comparableCount }: Props) {
  const [showWarning, setShowWarning] = useState(false);
  const nextHref = `/cases/${caseId}?step=4`;
  const meetsMinimum = comparableCount >= 2;

  function handleContinue(e: React.MouseEvent) {
    if (!meetsMinimum) {
      e.preventDefault();
      setShowWarning(true);
    }
  }

  return (
    <div className="pt-8 mt-8 border-t border-zinc-100 space-y-4">
      {showWarning && (
        <div className="rounded-xl px-5 py-4 bg-amber-50/80 ring-1 ring-amber-200/60">
          <p className="text-sm font-medium text-amber-800">
            At least 2 comparables are required before proceeding.{" "}
            {comparableCount === 0
              ? "No comparables have been added yet."
              : "You currently have 1 comparable."}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => {
                setShowWarning(false);
                document
                  .getElementById("comparable-form")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={btnPrimary}
            >
              Add another comparable
            </button>
            <Link href={nextHref} className={btnSecondary}>
              Continue anyway
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link
          href={`/cases/${caseId}?step=2`}
          className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          &larr; Back
        </Link>
        {meetsMinimum ? (
          <Link href={nextHref} className={btnPrimary}>
            Continue to Valuation
          </Link>
        ) : (
          <button type="button" onClick={handleContinue} className={btnPrimary}>
            Continue to Valuation
          </button>
        )}
      </div>
    </div>
  );
}
