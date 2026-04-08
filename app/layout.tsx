import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedBook Pro",
  description: "Property valuation management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] font-[family-name:var(--font-geist-sans)] text-[15px] leading-relaxed antialiased">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-zinc-100">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-[15px] font-semibold tracking-tight text-zinc-900"
            >
              RedBook Pro
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="text-sm text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-md transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/cases/new"
                className="text-sm font-medium bg-zinc-900 text-white px-3.5 py-1.5 rounded-lg transition-colors hover:bg-zinc-800"
              >
                New Case
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
