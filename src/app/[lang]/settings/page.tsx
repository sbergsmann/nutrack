
import { getDictionary } from "@/lib/get-dictionary";
import { SettingsPageClient } from "@/components/SettingsPageClient";

export default async function SettingsPageLoader({ params }: { params: { lang: string } }) {
  const resolvedParams = await params;
  const dictionary = await getDictionary(resolvedParams.lang);
  return <SettingsPageClient dictionary={dictionary.settings} />;
}
