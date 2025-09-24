import { Leaf } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold"
        >
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-headline">NutriTrack</span>
        </Link>
      </div>
    </header>
  );
}
