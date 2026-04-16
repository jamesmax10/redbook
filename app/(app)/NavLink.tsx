"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "text-white bg-[#363B52]"
          : "text-[#9CA3AF] hover:text-white hover:bg-[#363B52]"
      }`}
    >
      {children}
    </Link>
  );
}
