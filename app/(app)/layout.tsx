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
      <aside className="fixed left-0 top-0 h-screen w-52 z-30 bg-[#2D3142] flex flex-col">
        <Link
          href="/"
          className="flex items-center px-4 py-3 border-b border-[#3D4260] hover:bg-[#363B52] transition-colors"
        >
          <img
            src="/logo.png"
            alt="RedBook Pro"
            className="h-7 w-auto brightness-0 invert opacity-90"
          />
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

      </aside>

      {/* Top header */}
      <header className="fixed top-0 left-52 right-0 h-12 z-20 bg-white border-b border-zinc-200 flex items-center justify-end px-6">
        <UserMenu />
      </header>

      {/* Main content */}
      <main className="ml-52 mt-12 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </>
  );
}
