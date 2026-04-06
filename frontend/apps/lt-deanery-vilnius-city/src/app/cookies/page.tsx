import { Metadata } from 'next';
import { entityConfig } from '@/config/entity';

export const metadata: Metadata = {
  title: 'Slapukų politika | Cookie Policy',
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Slapukų politika</h1>
        <p className="text-gray-600 mt-2">Cookie Policy</p>
      </div>

      <div className="prose max-w-none">
        <h2>Kas yra slapukai?</h2>
        <p>
          Slapukai yra maži tekstiniai failai, kurie saugomi jūsų įrenginyje, kai lankotės 
          mūsų svetainėje. Jie padeda mums užtikrinti svetainės veikimą, analizuoti lankytojų 
          elgesį ir teikti suasmenintą turinį.
        </p>

        <h2>Naudojami slapukai</h2>
        
        <div className="space-y-4 not-prose">
          <div className="p-4 border rounded-lg">
            <h3 className="font-bold text-lg">Būtini slapukai</h3>
            <p className="text-sm text-gray-600">
              Reikalingi svetainės pagrindinėms funkcijoms: autentifikavimui, sesijos valdymui, 
              saugumui. Šių slapukų išjungti negalima.
            </p>
            <p className="text-xs text-gray-500 mt-2">Saugojimo laikotarpis: Sesijos pabaiga</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-bold text-lg">Analitiniai slapukai</h3>
            <p className="text-sm text-gray-600">
              Padeda suprasti, kaip lankytojai naudojasi svetaine, statistikos tikslais. 
              Duomenys yra anoniminiai.
            </p>
            <p className="text-xs text-gray-500 mt-2">Saugojimo laikotarpis: 2 metai</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-bold text-lg">Rinkodaros slapukai</h3>
            <p className="text-sm text-gray-600">
              Naudojami suasmenintai reklamos rodymui ir lankytojų sekimui skirtinguose puslapiuose.
            </p>
            <p className="text-xs text-gray-500 mt-2">Saugojimo laikotarpis: 1 metai</p>
          </div>
        </div>

        <h2>Jūsų teisės</h2>
        <p>
          Pagal GDPR ir ePrivacy direktyvą, turite teisę sutikti arba atmesti slapukų naudojimą 
          (išskyrus būtinuosius). Savo pasirinkimą galite bet kada pakeisti paspaudę 
          „Slapukų nuostatos" mygtuką svetainės apačioje.
        </p>

        <h2>Kaip išjungti slapukus?</h2>
        <p>
          Daugumoje naršyklių galite valdyti slapukų nuostatas nustatymuose. Atkreipkite 
          dėmesį, kad išjungus kai kuriuos slapukus, svetainė gali neveikti tinkamai.
        </p>

        <h2>Kontaktai</h2>
        <p>
          Dėl klausimų apie slapukų naudojimą kreipkitės:{' '}
          <a href={`mailto:${entityConfig.contact.email}`} className="text-blue-600 hover:underline">
            {entityConfig.contact.email}
          </a>
        </p>
      </div>
    </div>
  );
}
