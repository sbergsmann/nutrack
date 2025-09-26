
import { getDictionary } from "@/lib/get-dictionary";
import { HomePageClient } from "@/components/HomePageClient";

export default async function HomePage({ params }: { params: { lang: string } }) {
  const resolvedParams = await params;
  const dictionary = await getDictionary(resolvedParams.lang as any);
  return <HomePageClient dictionary={dictionary} />;
}
