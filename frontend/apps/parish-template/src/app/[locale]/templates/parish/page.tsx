/**
 * Parish Church Template
 * URL: /[locale]/templates/parish
 */

import { notFound } from 'next/navigation';

const SUPPORTED_LOCALES = ['lt', 'ru', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(v: string): v is SupportedLocale {
  return SUPPORTED_LOCALES.includes(v as SupportedLocale);
}

// Mark as dynamic route (don't statically generate all locales at build time)
export const dynamicParams = true;

export default async function ParishPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> | { locale: string } 
}) {
  // Handle both async and sync params (Next.js version differences)
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams?.locale || 'lt';

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const content = {
    lt: {
      title: 'Parapija | JOL-HUB',
      heading: 'Sveiki atvykę į parapiją',
      schedule: 'Pamaldų tvarkaraštis',
      donate: 'Paaukokite',
    },
    ru: {
      title: 'Приход | JOL-HUB',
      heading: 'Добро пожаловать в приход',
      schedule: 'Расписание богослужений',
      donate: 'Пожертвовать',
    },
    en: {
      title: 'Parish | JOL-HUB',
      heading: 'Welcome to our Parish',
      schedule: 'Mass Schedule',
      donate: 'Donate',
    },
  };

  const t = content[locale];

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>{t.heading}</h1>
      <p>Language: {locale}</p>
      
      <section style={{ marginTop: '2rem' }}>
        <h2>{t.schedule}</h2>
        <p>Coming soon: Integration with Bitrix24 Calendar</p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>{t.donate}</h2>
        <p>Coming soon: Donation widget integration</p>
      </section>

      <footer style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #ccc' }}>
        <p>© 2026 JOL-HUB | {t.title}</p>
      </footer>
    </main>
  );
}
