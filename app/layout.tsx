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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 font-[family-name:var(--font-geist-sans)]">
        <header className="bg-white border-b border-zinc-200">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-zinc-900">
              RedBook Pro
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/"
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                Dashboard
              </Link>
              <Link
                href="/cases/new"
                className="text-sm bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-700"
              >
                New Case
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
