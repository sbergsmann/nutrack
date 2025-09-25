
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";

const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/tracking", label: "Tracking" },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: user } = useUser();

  if (!user) return null;

  return (
    <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
      {navLinks.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
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
