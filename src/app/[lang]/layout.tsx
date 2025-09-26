import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import { i18n, type Locale } from "@/i18n.config";
import { getDictionary } from "@/lib/get-dictionary";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { Toaster } from "@/components/ui/toaster";
import "../globals.css";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Locale };
}>) {
  const dictionary = await getDictionary(params.lang);
  return (
    <>
        <div className={cn("font-body antialiased h-full")}>
          <FirebaseClientProvider>
            <div className="flex flex-col h-full">
              <Header lang={params.lang} dictionary={dictionary.header} />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
            <Toaster />
            <SpeedInsights />
            <Analytics />
          </FirebaseClientProvider>
        </div>
    </>
  );
}
