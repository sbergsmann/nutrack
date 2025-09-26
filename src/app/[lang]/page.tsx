
import { getDictionary } from "@/lib/get-dictionary";
import { HomePageClient } from "@/components/HomePageClient";
import type { Locale } from "@/i18n.config";

export default async function HomePage({ params }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(params.lang);
  return <HomePageClient dictionary={dictionary} />;
}
