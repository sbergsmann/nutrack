
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";

export function MobileNavigation({ dictionary }: { dictionary: any }) {
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang;
  const { data: user } = useUser();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/", label: dictionary.dashboard },
    { href: "/tracking", label: dictionary.tracking },
    { href: "/premium", label: dictionary.pricing },
    { href: "/settings", label: dictionary.settings },
  ];

  if (!user) return null;

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">{dictionary.openMenu}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{dictionary.menu}</SheetTitle>
          </SheetHeader>
          <nav className="mt-8 flex flex-col gap-4">
            {navLinks.map(({ href, label }) => {
              const fullPath = `/${lang}${href}`;
              const isActive =
                href === "/" ? pathname === `/${lang}` : pathname.startsWith(fullPath);
              return (
                <Link
                  key={href}
                  href={fullPath}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-lg font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
