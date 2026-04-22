import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const step = sp.step as string | undefined;
  const saved = sp.saved as string | undefined;

  if (step === "evidence" || sp.added === "1") {
    redirect(`/cases/${id}/evidence`);
  }
  if (step === "analysis" || step === "4") {
    const suffix = saved ? `?saved=${saved}` : "";
    redirect(`/cases/${id}/analysis${suffix}`);
  }
  if (step === "3") {
    redirect(`/cases/${id}/evidence`);
  }
  redirect(`/cases/${id}/overview`);
}
