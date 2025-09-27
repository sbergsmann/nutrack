
import { getDictionary } from "@/lib/get-dictionary";
import { PremiumPageClient } from "@/components/PremiumPageClient";
import type { Locale } from "@/i18n.config";

export default async function PremiumPageLoader({ params }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(params.lang);
  return <PremiumPageClient dictionary={dictionary.premium} />;
}
