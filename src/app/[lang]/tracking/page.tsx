
import { getDictionary } from "@/lib/get-dictionary";
import { TrackingPageClient } from "@/components/TrackingPageClient";

export default async function TrackingPageLoader({ params }: { params: { lang: string } }) {
  const resolvedParams = await params;
  const dictionary = await getDictionary(resolvedParams.lang as any);
  return <TrackingPageClient dictionary={dictionary.dailyTracker} />;
}
