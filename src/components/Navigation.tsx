
"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";

const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/tracking", label: "Tracking" },
    { href: "/premium", label: "Pricing" },
    { href: "/settings", label: "Settings" },
];

export function Navigation() {
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang;
  const { data: user } = useUser();

  if (!user) return null;

  return (
    <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
      {navLinks.map(({ href, label }) => {
        const fullPath = `/${lang}${href}`;
        const isActive = href === "/" ? pathname === `/${lang}` : pathname.startsWith(fullPath);
        return (
          <Link
            key={href}
            href={fullPath}
            className={cn(
              "transition-colors hover:text-foreground",
              isActive && "text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
