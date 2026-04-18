"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { inputClass, btnPrimary, card, labelClass } from "@/lib/styles";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }
    setMessage({ type: "success", text: "Password updated successfully." });
    setTimeout(() => router.push("/"), 2000);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <img
            src="/logo.png"
            alt="RedBook Pro"
            style={{ height: "80px", width: "auto" }}
          />
        </div>

        <div className={`${card} p-6`}>
          <h1 className="text-lg font-semibold text-zinc-900 mb-1">
            Reset your password
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label htmlFor="password" className={labelClass}>
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirm" className={labelClass}>
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                    : "bg-red-50 text-red-700 ring-red-200/60"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`${btnPrimary} w-full`}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
