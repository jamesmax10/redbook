"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { inputClass, btnPrimary, card, labelClass } from "@/lib/styles";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (password.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setLoading(false);
    setPassword("");
    setConfirmPassword("");
    setMode("login");
    setMessage({
      type: "success",
      text: "Account created — you can now sign in.",
    });
  }

  return (
    <div
      className="min-h-screen bg-[#f5f5f4] flex items-center 
                    justify-center px-4"
    >
      <div className="w-full max-w-lg flex flex-col items-center">
        <div className="relative mb-4 pr-16 pt-8">
          <img
            src="/logo.png"
            alt=""
            className="absolute right-0 -top-2 h-24 w-24 object-contain"
          />
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-zinc-800 tracking-tight">
              RedBook
            </span>
            <span className="text-5xl font-light text-zinc-800 tracking-tight ml-2">
              Pro
            </span>
          </div>
        </div>
        <p className="text-sm text-zinc-500 text-center mb-8">
          {mode === "login"
            ? "Sign in to your account"
            : "Create your account"}
        </p>

        <div className={`${card} p-6 w-full max-w-sm`}>
          <form
            onSubmit={mode === "login" ? handleLogin : handleSignUp}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="confirm" className={labelClass}>
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            )}

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
              {loading
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-zinc-100 text-center">
            <button
              type="button"
              onClick={() =>
                switchMode(mode === "login" ? "signup" : "login")
              }
              className="text-sm text-zinc-500 hover:text-zinc-800 
                         transition-colors"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          RedBook Pro · Professional Valuation Platform
        </p>
      </div>
    </div>
  );
}
