
import { getDictionary } from "@/lib/get-dictionary";
import { SettingsPageClient } from "@/components/SettingsPageClient";
import type { Locale } from "@/i1g18n.config";

export default async function SettingsPageLoader({ params }: { params: { lang: Locale } }) {
  const dictionary = await getDictionary(params.lang);
  return <SettingsPageClient dictionary={dictionary.settings} />;
}
