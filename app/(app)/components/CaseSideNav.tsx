"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type TabKey = "overview" | "comparables" | "valuation" | "report";

function getActiveTab(pathname: string, step: string | null): TabKey {
  if (pathname.endsWith("/report")) return "report";
  if (step === "3") return "comparables";
  if (step === "4" || step === "5") return "valuation";
  return "overview";
}

function CaseSideNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const match = pathname.match(/^\/cases\/([^/]+)/);
  if (!match || match[1] === "new") return null;

  const id = match[1];
  const activeTab = getActiveTab(pathname, searchParams.get("step"));

  const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "overview", label: "Overview", href: `/cases/${id}/overview` },
    { key: "comparables", label: "Comparables", href: `/cases/${id}?step=3` },
    { key: "valuation", label: "Valuation", href: `/cases/${id}?step=4` },
    { key: "report", label: "Report", href: `/cases/${id}/report` },
  ];

  return (
    <div className="mt-1 border-t border-zinc-800/60 pt-2 px-2">
      <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-2 py-1.5">
        This Case
      </p>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? "text-white bg-zinc-800"
              : "text-zinc-500 hover:text-white hover:bg-zinc-800"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export default function CaseSideNav() {
  return (
    <Suspense fallback={null}>
      <CaseSideNavInner />
    </Suspense>
  );
}
