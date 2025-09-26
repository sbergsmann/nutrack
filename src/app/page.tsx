
'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {i18n} from '@/i18n.config';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Determine the best locale.
    const browserLang = navigator.language.split('-')[0];
    const defaultLocale = i18n.locales.includes(browserLang as any) ? browserLang : i18n.defaultLocale;
    router.replace(`/${defaultLocale}`);
  }, [router]);

  return null;
}
