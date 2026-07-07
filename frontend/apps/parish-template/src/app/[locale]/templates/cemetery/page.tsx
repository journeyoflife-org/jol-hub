/**
 * Locale-aware Cemetery Cleaning Template Route
 * URL: /[locale]/templates/cemetery
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CemeteryTemplatePage from '../../templates/cemetery/page';

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
    lt: 'Kapų priežiūra | JOL-HUB',
    ru: 'Уход за могилами | JOL-HUB',
    en: 'Cemetery Cleaning Services | JOL-HUB',
  };

  const descriptions: Record<SupportedLocale, string> = {
    lt: 'Profesionali kapų priežiūra ir valymas. Prieš ir po nuotraukos, kainų skaičiuoklė.',
    ru: 'Профессиональный уход за могилами. Фото до и после, калькулятор стоимости.',
    en: 'Professional grave maintenance and cleaning. Before/after photos and pricing calculator.',
  };

  return {
    title: titles[resolvedLocale],
    description: descriptions[resolvedLocale],
    keywords:
      resolvedLocale === 'lt'
        ? ['kapų priežiūra', 'valymas', 'kapinės', 'techninis aptarnavimas', 'prenumerata']
        : resolvedLocale === 'ru'
          ? ['уход за могилами', 'уборка', 'кладбище', 'обслуживание', 'подписка']
          : ['cemetery cleaning', 'grave maintenance', 'memorial care', 'subscription'],
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

export default async function LocaleCemeteryPage({ params }: LocalePageProps): Promise<JSX.Element> {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <CemeteryTemplatePage params={params} />;
}
