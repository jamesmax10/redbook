import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: cases, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Cases</h1>
        <Link
          href="/cases/new"
          className="bg-zinc-900 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700"
        >
          New Case
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          Failed to load cases: {error.message}
        </div>
      )}

      {cases && cases.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-zinc-200">
          <p className="text-zinc-500 mb-4">No cases yet.</p>
          <Link
            href="/cases/new"
            className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-md hover:bg-zinc-700"
          >
            Create your first case
          </Link>
        </div>
      )}

      {cases && cases.length > 0 && (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">
                  Client
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">
                  Property Address
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">
                  Valuation Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">
                  Purpose
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/cases/${c.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {c.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {c.property_address}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {c.valuation_date}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{c.purpose}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
