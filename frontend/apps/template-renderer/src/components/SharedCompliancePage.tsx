/**
 * Shared tenant-independent compliance pages (privacy, cookies, consent, DSR).
 *
 * These routes are NOT part of tenant fixtures: they are shared UI that was
 * duplicated across all 12 legacy lt-* apps. Rendering them once here keeps
 * fixtures limited to differentiating content.
 */
import { Card, CardContent } from '@jol-hub/ui';
import type { TenantFixture } from '@jol-hub/seed-data';
import type { SharedRoute } from '@/lib/content-loader';

interface SharedCompliancePageProps {
  route: SharedRoute;
  fixture: TenantFixture;
  basePath: string;
}

export function SharedCompliancePage({ route, fixture }: SharedCompliancePageProps) {
  const name = fixture.name.lt;
  const email = fixture.identity?.email;
  const phone = fixture.identity?.phone;
  const address = fixture.identity?.address;

  const body: Record<SharedRoute, { title: string; paragraphs: string[] }> = {
    '/privacy': {
      title: 'Privatumo politika / Privacy Policy',
      paragraphs: [
        `${name} tvarko asmens duomenis pagal Bendrąjį duomenų apsaugos reglamentą (GDPR), įskaitant Art. 9 nuostatas dėl ypatingų kategorijų duomenų.`,
        'Sakramentų ir religinės bendruomenės narystės duomenys tvarkomi tik teisėtais pagrindais (sutikimas, kanonų teisės prievolės) ir nėra atskleidžiami tretiesiems asmenims be teisinio pagrindo.',
        email
          ? `Dėl duomenų apsaugos klausimų kreipkitės: ${email}${phone ? `, tel. ${phone}` : ''}.`
          : 'Dėl duomenų apsaugos klausimų kreipkitės į įstaigos administraciją.',
      ],
    },
    '/cookies': {
      title: 'Slapukų politika / Cookie Policy',
      paragraphs: [
        'Ši svetainė naudoja tik būtinuosius slapukus, reikalingus saugiam veikimui ir sutikimų valdymui.',
        'Trečiųjų šalių rinkodaros ar stebėsenos slapukai nenaudojami be aiškaus išankstinio sutikimo.',
      ],
    },
    '/consent': {
      title: 'Sutikimų valdymas / Consent Management',
      paragraphs: [
        'Čia galite peržiūrėti ir keisti savo sutikimus duomenų tvarkymui.',
        'Sutikimai versijuojami ir jų istorija saugoma audito tikslais; bet kurį sutikimą galite atšaukti bet kuriuo metu.',
        email ? `Pagalba: ${email}.` : 'Pagalbos kreipkitės į įstaigos administraciją.',
      ],
    },
    '/dsr': {
      title: 'Duomenų subjekto teisės / Data Subject Requests',
      paragraphs: [
        'Turite teisę prašyti prieigos, ištaisymo, ištrynimo, tvarkymo apribojimo, duomenų perkeliamumo ir teisės nesutikti (GDPR 15-21 str.).',
        'Prašymus nagrinėjame per 30 dienų. Tapatybė patvirtinama prieš pateikiant bet kokius duomenis.',
        email ? `Prašymus siųskite: ${email}.` : 'Prašymus teikite įstaigos administracijai.',
      ],
    },
  };

  const { title, paragraphs } = body[route];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold text-primary">{title}</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
          {address && <p className="text-sm text-gray-500 pt-2 border-t">{address}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
