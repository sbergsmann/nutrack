
import { getDictionary } from "@/lib/get-dictionary";
import { TrackingPageClient } from "@/components/TrackingPageClient";
import type { Locale } from "@/i18n.config";

export default async function TrackingPageLoader({ params }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(params.lang);
  return <TrackingPageClient dictionary={dictionary.dailyTracker} />;
}
