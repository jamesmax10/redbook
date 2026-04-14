"use client";

import { useTransition } from "react";
import { deleteComparable } from "@/app/actions";

interface Props {
  comparableId: string;
  caseId: string;
  redirectStep?: string;
}

export default function DeleteComparableButton({
  comparableId,
  caseId,
  redirectStep,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this comparable? This cannot be undone.")) return;
    startTransition(() => {
      deleteComparable(comparableId, caseId, redirectStep);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-zinc-400 hover:text-red-600 disabled:opacity-50 text-sm transition-colors"
      title="Delete comparable"
    >
      {isPending ? "\u2026" : "\u2715"}
    </button>
  );
}
