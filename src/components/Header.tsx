
import Link from "next/link";
import { UserProfile } from "./UserProfile";
import { Navigation } from "./Navigation";
import { MobileNavigation } from "./MobileNavigation";
import type { Locale } from "@/i18n.config";

export default async function Header({ lang, dictionary }: { lang: Locale, dictionary: any }) {

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6">
            <Link
            href={`/${lang}`}
            className="flex items-center gap-2 text-xl font-semibold"
            >
            <span className="font-headline">Nutrack<span className="text-primary">9</span></span>
            </Link>
            <Navigation dictionary={dictionary.nav} />
        </div>
        <div className="flex items-center gap-2">
            <UserProfile dictionary={dictionary.userProfile} />
            <MobileNavigation dictionary={dictionary.nav} />
        </div>
      </div>
    </header>
  );
}
