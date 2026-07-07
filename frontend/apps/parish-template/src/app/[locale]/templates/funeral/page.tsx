/**
 * Locale-aware Funeral Services Template Route
 * URL: /[locale]/templates/funeral
 * 
 * ISR: 1h inherited from the template; robots nofollow for obituary privacy.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import FuneralTemplatePage from '../../templates/funeral/page';

const SUPPORTED_LOCALES = ['lt', 'ru', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(v: string): v is SupportedLocale {
  return SUPPORTED_LOCALES.includes(v as SupportedLocale);
}

interface LocalePageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = params;
  const resolvedLocale = isSupportedLocale(locale) ? locale : 'lt';

  const titles: Record<SupportedLocale, string> = {
    lt: 'Laidojimo paslaugos | JOL-HUB',
    ru: 'Ритуальные услуги | JOL-HUB',
    en: 'Funeral Services | JOL-HUB',
  };

  const descriptions: Record<SupportedLocale, string> = {
    lt: 'Nekrologai, gėlių užsakymas, užuojautų knyga ir laidojimo paslaugos.',
    ru: 'Некрологи, заказ цветов, книга соболезнований и ритуальные услуги.',
    en: 'Obituaries, flower orders, condolence book and funeral services.',
  };

  return {
    title: titles[resolvedLocale],
    description: descriptions[resolvedLocale],
    // Obituary pages: don't follow links to protect family privacy
    robots: { index: true, follow: false },
    openGraph: {
      locale:
        resolvedLocale === 'lt'
          ? 'lt_LT'
          : resolvedLocale === 'ru'
            ? 'ru_RU'
            : 'en_US',
    },
  };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleFuneralPage({ params }: LocalePageProps): Promise<JSX.Element> {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <FuneralTemplatePage params={params} />;
}
