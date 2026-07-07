import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getParishConfig } from '../../lib/parish-config';

export const revalidate = 600; // ISR: 10 minutes

const SUPPORTED_LOCALES = ['lt', 'ru', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(v: string): v is SupportedLocale {
  return SUPPORTED_LOCALES.includes(v as SupportedLocale);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const headersList = await headers();
  const subdomain = headersList.get('x-subdomain') ?? '';
  const parishConfig = subdomain ? await getParishConfig(subdomain) : null;

  const resolvedLocale = isSupportedLocale(locale) ? locale : 'lt';

  const names: Record<SupportedLocale, string> = {
    lt: parishConfig?.nameLt ?? 'Parapija',
    ru: parishConfig?.nameRu ?? parishConfig?.nameLt ?? 'Приход',
    en: parishConfig?.nameEn ?? parishConfig?.nameLt ?? 'Parish',
  };

  const name = names[resolvedLocale];

  return {
    title: name,
    description:
      resolvedLocale === 'lt'
        ? `${name} – pamaldų tvarkaraštis, naujienos ir kontaktai.`
        : resolvedLocale === 'ru'
          ? `${name} – расписание богослужений, новости и контакты.`
          : `${name} – mass schedule, news and contacts.`,
  };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface LocaleHomePageProps {
  params: { locale: string };
}

export default async function LocaleHomePage({
  params,
}: LocaleHomePageProps): Promise<never> {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Route to the parish template (most common: 727 instances)
  // Future: detect parish type from subdomain config and redirect accordingly
  redirect(`/${locale}/templates/parish`);
}
