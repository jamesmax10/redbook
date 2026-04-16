import Link from "next/link";
import NavLink from "./NavLink";
import SignOutButton from "./components/SignOutButton";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 z-30 bg-zinc-950 flex flex-col">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800 hover:bg-zinc-900 transition-colors"
        >
          <span className="text-white font-bold text-sm tracking-wide">
            RedBook
          </span>
          <span className="text-red-500 font-bold text-sm tracking-wide">
            Pro
          </span>
        </Link>

        <nav className="flex-1 py-4 space-y-1">
          <NavLink href="/">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </NavLink>
          <NavLink href="/cases/new">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            New Case
          </NavLink>
        </nav>

        <div className="border-t border-zinc-800 px-3 py-4 space-y-1">
          <p className="text-xs text-zinc-600 px-2 mb-2">RedBook Pro v0.1</p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </>
  );
}
