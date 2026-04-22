import Link from "next/link";
import NavLink from "./NavLink";
import UserMenu from "./components/UserMenu";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 z-30 bg-zinc-950 flex flex-col border-r border-zinc-900">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800/60 hover:bg-zinc-900 transition-colors"
        >
          <img
            src="/logo.png"
            alt="RedBook Pro"
            className="h-6 w-auto brightness-0 invert opacity-80"
          />
        </Link>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          <NavLink href="/">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
              strokeLinejoin="round" className="shrink-0">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            All Cases
          </NavLink>
          <NavLink href="/cases/new">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
              strokeLinejoin="round" className="shrink-0">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Case
          </NavLink>
        </nav>

        <div className="px-4 py-3 border-t border-zinc-800/60 mt-auto">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
            RICS Red Book 2024
          </p>
        </div>
      </aside>

      {/* Top header */}
      <header className="fixed top-0 left-56 right-0 h-11 z-20 bg-white border-b border-zinc-200 flex items-center justify-end px-6">
        <UserMenu />
      </header>

      {/* Main content — no max-w constraint here; each page/layout owns its container */}
      <main className="ml-56 mt-11 min-h-screen bg-zinc-50/30">
        {children}
      </main>
    </>
  );
}
