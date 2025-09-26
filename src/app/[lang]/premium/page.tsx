import { getDictionary } from "@/lib/get-dictionary";
import { PremiumPageClient } from "@/components/PremiumPageClient";

export default async function PremiumPageLoader({ params }: { params: { lang: string } }) {
  const resolvedParams = await params;
  const dictionary = await getDictionary(resolvedParams.lang);
  return <PremiumPageClient dictionary={dictionary.premium} />;
}
