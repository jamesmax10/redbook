"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState("...");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      const name = data.user?.user_metadata?.first_name as string;
      if (name) {
        setInitials(name.slice(0, 2).toUpperCase());
      } else {
        setInitials((data.user?.email ?? "?").slice(0, 2).toUpperCase());
      }
    });
  }, []);

  async function handleResetPassword() {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Password reset email sent — check your inbox.");
      setOpen(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 rounded-full bg-[#2D3142] flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {initials}
          </span>
        </div>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-10 z-20 w-64 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100">
              <p className="text-xs text-zinc-400">Signed in as</p>
              <p className="text-sm font-medium text-zinc-900 truncate mt-0.5">
                {email}
              </p>
            </div>
            <button
              onClick={handleResetPassword}
              className="w-full text-left px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2 border-b border-zinc-100"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Reset password
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
