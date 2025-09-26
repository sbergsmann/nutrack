import { getDictionary } from "@/lib/get-dictionary";
import { DayPageClient } from "@/components/DayPageClient";

export default async function DayPageLoader({ params }: { params: { date: string, lang: string } }) {
  const resolvedParams = await params;
  const dictionary = await getDictionary(resolvedParams.lang as any);
  return <DayPageClient dateString={resolvedParams.date} dictionary={dictionary.dailyTracker} />;
}
