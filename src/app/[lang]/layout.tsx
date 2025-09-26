
import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { i18n, type Locale } from "@/i18n.config";


export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Locale };
}>) {
  return (
    <FirebaseClientProvider>
      <div className="flex flex-col h-full">
        <Header lang={params.lang} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Toaster />
      </div>
    </FirebaseClientProvider>
  );
}
