
import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { i18n, type Locale } from "@/i18n.config";

export const metadata: Metadata = {
  title: "Nutrack9",
  description: "Track your daily food intake and mood.",
  manifest: "/manifest.json",
};

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
    <html lang={params.lang} className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#F87171" />
      </head>
      <body className={cn("font-body antialiased h-full")}>
        <FirebaseClientProvider>
          <div className="flex flex-col h-full">
            <Header lang={params.lang} />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
            <Toaster />
          </div>
        </FirebaseClientProvider>
        <SpeedInsights/>
      </body>
    </html>
  );
}
