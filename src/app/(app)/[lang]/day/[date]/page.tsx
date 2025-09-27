
import { getDictionary } from "@/lib/get-dictionary";
import { DayPageClient } from "@/components/DayPageClient";
import type { Locale } from "@/i18n.config";

export default async function DayPageLoader({ params }: { params: { date: string, lang: Locale } }) {
  const dictionary = await getDictionary(params.lang);
  return <DayPageClient dateString={params.date} dictionary={dictionary.dailyTracker} />;
}
