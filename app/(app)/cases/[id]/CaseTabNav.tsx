"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const TABS = [
  { key: "overview", label: "Overview", segment: "overview" },
  { key: "evidence", label: "Evidence", segment: "evidence" },
  { key: "analysis", label: "Analysis", segment: "analysis" },
  { key: "report", label: "Draft Report", segment: "report" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function getActiveTab(pathname: string): TabKey {
  if (pathname.includes("/report")) return "report";
  if (pathname.includes("/analysis")) return "analysis";
  if (pathname.includes("/evidence")) return "evidence";
  return "overview";
}

function TabNavInner({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <nav className="flex gap-0 border-b border-zinc-200 px-6">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Link
            key={tab.key}
            href={`/cases/${caseId}/${tab.segment}`}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              isActive
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function CaseTabNav({ caseId }: { caseId: string }) {
  return (
    <Suspense fallback={<div className="h-12 border-b border-zinc-200 px-6" />}>
      <TabNavInner caseId={caseId} />
    </Suspense>
  );
}
