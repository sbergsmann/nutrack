
"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";

export function Navigation({ dictionary }: { dictionary: any }) {
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang;
  const { data: user } = useUser();

  const navLinks = [
      { href: "/", label: dictionary.dashboard },
      { href: "/tracking", label: dictionary.tracking },
      { href: "/premium", label: dictionary.pricing },
      { href: "/settings", label: dictionary.settings },
  ];

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
