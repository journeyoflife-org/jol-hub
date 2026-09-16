/**
 * Liturgical guard + clergy-verified terms dictionary.
 *
 * PURE module (no react / react-i18next imports) so the main package
 * barrel can export it without dragging the i18next runtime into server
 * bundles. Extracted from hooks/useTranslation.ts in STEP 4.
 */
import type { SupportedLocale } from '../types';

// ---------------------------------------------------------------------------

export interface DeepLTranslationResult {
  translations: Array<{
    /** ISO 639-1 code detected by DeepL, e.g. "LT" */
    detected_source_language?: string;
    text: string;
  }>;
}

/**
 * Options accepted by translateWithDeepL and translateBatchWithDeepL.
 * These are server-side only functions.
 */
export interface TranslateOptions {
  sourceLang?: string | null;
  formality?: 'default' | 'less' | 'more' | 'prefer_less' | 'prefer_more';
  splitSentences?: 'on' | 'off' | 'nonewlines';
  context?: string;
  tagHandling?: 'html' | 'xml';
}

// ---------------------------------------------------------------------------
// Liturgical guard
// ---------------------------------------------------------------------------

/**
 * Patterns that identify text containing liturgical content that must
 * NEVER be sent to any machine-translation service.
 *
 * Matched against the entire input string (case-insensitive).
 */
const LITURGICAL_GUARD_PATTERNS: RegExp[] = [
  // Bible references  — "John 3:16", "Ps 22", "Jn 3,16"
  /\b(?:Gen|Ex|Lev|Num|Deut|Josh|Judg|Ruth|Sam|Kgs|Chr|Ezra|Neh|Esth|Job|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt?|Mk|Lk|Jn|Acts|Rom|1?Cor|Gal|Eph|Phil|Col|1?Thess|1?Tim|Tit|Phlm|Heb|Jas|1?Pet|1?Jn|Jude|Rev)\s+\d+/i,
  /\b(?:Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation|Genesis|Exodus|Psalms?)\s+\d+/i,
  // Named prayers
  /\b(?:Our Father|Hail Mary|Glory Be|Apostles'? Creed|Nicene Creed|Act of Contrition|Salve Regina|Memorare|Angelus|Te Deum|Magnificat|Rosary|Divine Mercy Chaplet)/i,
  // Liturgical ordinary
  /\b(?:Kyrie(?:\s+eleison)?|Gloria in Excelsis|Credo|Sanctus|Benedictus|Agnus Dei|Ite Missa est)/i,
  // Latin liturgical phrases
  /\b(?:In nomine Patris|Et cum spiritu tuo|Pax vobiscum|Dominus vobiscum|Oremus|Per Christum Dominum)/i,
];

/**
 * Returns `true` when `text` contains liturgical / sacred content that
 * must not be sent to DeepL.
 *
 * Callers **must** check this before calling {@link translateWithDeepL}.
 * The {@link translateUserContent} utility does this automatically.
 */
export function containsLiturgicalContent(text: string): boolean {
  return LITURGICAL_GUARD_PATTERNS.some((re) => re.test(text));
}

// ---------------------------------------------------------------------------
// Liturgical terms dictionary
// ---------------------------------------------------------------------------

/**
 * Hardcoded liturgical terms that must NEVER be sent to any auto-translation
 * service, including DeepL.  These translations have been verified by clergy.
 *
 * Keys use underscored Lithuanian canonical form.
 * Lookup via {@link getLiturgicalTerm}.
 */
export const LITURGICAL_TERMS: Record<SupportedLocale, Record<string, string>> =
  {
    lt: {
      mišios: 'Mišios',
      liturgija: 'Liturgija',
      šv_mišios: 'Šv. Mišios',
      adventas: 'Adventas',
      kūčios: 'Kūčios',
      kalėdos: 'Kalėdos',
      velykos: 'Velykos',
      sekmadienis: 'Sekmadienis',
      penktadienis: 'Penktadienis',
      marijos_ėmimas_į_dangų: 'Marijos Ėmimas į Dangų',
      visų_šventųjų: 'Visų Šventųjų',
      mirusiųjų_atminimo_diena: 'Mirusiųjų atminimo diena',
      katalikų: 'Katalikų',
      parapija: 'Parapija',
      bažnyčia: 'Bažnyčia',
      šventovė: 'Šventovė',
      kapelė: 'Kapelė',
      kripta: 'Kripta',
      altorius: 'Altorius',
      tabernakulis: 'Tabernakulis',
      šventasis: 'Šventasis',
      šventoji: 'Šventoji',
      palaimintasis: 'Palaimintasis',
      kankinys: 'Kankinys',
      maldos: 'Maldos',
      rožinis: 'Rožinis',
      adoracija: 'Adoracija',
      eucharistija: 'Eucharistija',
      sakramentas: 'Sakramentas',
      krikštas: 'Krikštas',
      sutvirtinimas: 'Sutvirtinimas',
      išpažintis: 'Išpažintis',
      santuoka: 'Santuoka',
      paskutinis_patepimas: 'Paskutinis patepimas',
      katalikų_bažnyčia: 'Katalikų Bažnyčia',
      popiežius: 'Popiežius',
      kardinolas: 'Kardinolas',
      arkivyskupas: 'Arkivyskupas',
      vyskupas: 'Vyskupas',
      kunigas: 'Kunigas',
      diakonas: 'Diakonas',
      vienuolis: 'Vienuolis',
      vienuolė: 'Vienuolė',
      pasninkas: 'Pasninkas',
      pasninko_diena: 'Pasninko diena',
      gavėnia: 'Gavėnia',
      didžioji_savaitė: 'Didžioji savaitė',
      sekminės: 'Sekminės',
      trejybės_sekmadienis: 'Trejybės sekmadienis',
      kūno_ir_kraujo_kristaus: 'Kūno ir Kraujo Kristaus',
      švč_marijos_dangun_žengimo: 'Švč. Marijos Dangun Žengimo',
      švč_marijos_gimimo: 'Švč. Marijos Gimimo',
      švč_marijos_įvedimo_į_bažnyčią: 'Švč. Marijos Įvedimo į Bažnyčią',
      švč_trejybės: 'Švč. Trejybės',
      švč_jėzaus_širdies: 'Švč. Jėzaus Širdies',
      švč_marijos_širdies: 'Švč. Marijos Širdies',
      atlaidai: 'Atlaidai',
      šventadienis: 'Šventadienis',
    },
    ru: {
      mišios: 'Литургия',
      liturgija: 'Литургия',
      šv_mišios: 'Святая Литургия',
      adventas: 'Адвент',
      kūčios: 'Сочельник',
      kalėdos: 'Рождество',
      velykos: 'Пасха',
      sekmadienis: 'Воскресенье',
      penktadienis: 'Пятница',
      marijos_ėmimas_į_dangų: 'Вознесение Пресвятой Девы Марии',
      visų_šventųjų: 'День всех святых',
      mirusiųjų_atminimo_diena: 'День поминовения усопших',
      katalikų: 'Католическая',
      parapija: 'Приход',
      bažnyčia: 'Церковь',
      šventovė: 'Святыня',
      kapelė: 'Часовня',
      kripta: 'Крипта',
      altorius: 'Алтарь',
      tabernakulis: 'Табернакль',
      šventasis: 'Святой',
      šventoji: 'Святая',
      palaimintasis: 'Блаженный',
      kankinys: 'Мученик',
      maldos: 'Молитвы',
      rožinis: 'Розарий',
      adoracija: 'Адорация',
      eucharistija: 'Евхаристия',
      sakramentas: 'Таинство',
      krikštas: 'Крещение',
      sutvirtinimas: 'Миропомазание',
      išpažintis: 'Исповедь',
      santuoka: 'Венчание',
      paskutinis_patepimas: 'Соборование',
      katalikų_bažnyčia: 'Католическая Церковь',
      popiežius: 'Папа',
      kardinolas: 'Кардинал',
      arkivyskupas: 'Архиепископ',
      vyskupas: 'Епископ',
      kunigas: 'Священник',
      diakonas: 'Диакон',
      vienuolis: 'Монах',
      vienuolė: 'Монахиня',
      pasninkas: 'Пост',
      pasninko_diena: 'Постный день',
      gavėnia: 'Великий пост',
      didžioji_savaitė: 'Страстная неделя',
      sekminės: 'Троица',
      trejybės_sekmadienis: 'Троицкая неделя',
      kūno_ir_kraujo_kristaus: 'Пресвятых Тела и Крови Христовых',
      švč_marijos_dangun_žengimo: 'Вознесения Пресвятой Девы Марии',
      švč_marijos_gimimo: 'Рождества Пресвятой Девы Марии',
      švč_marijos_įvedimo_į_bažnyčią: 'Введения во храм Пресвятой Девы Марии',
      švč_trejybės: 'Пресвятой Троицы',
      švč_jėzaus_širdies: 'Пресвятого Сердца Иисуса',
      švč_marijos_širdies: 'Непорочного Сердца Марии',
      atlaidai: 'Престольный праздник',
      šventadienis: 'Воскресенье',
    },
    en: {
      mišios: 'Holy Mass',
      liturgija: 'Liturgy',
      šv_mišios: 'Holy Mass',
      adventas: 'Advent',
      kūčios: 'Christmas Eve',
      kalėdos: 'Christmas',
      velykos: 'Easter',
      sekmadienis: 'Sunday',
      penktadienis: 'Friday',
      marijos_ėmimas_į_dangų: 'Assumption of Mary',
      visų_šventųjų: "All Saints' Day",
      mirusiųjų_atminimo_diena: "All Souls' Day",
      katalikų: 'Catholic',
      parapija: 'Parish',
      bažnyčia: 'Church',
      šventovė: 'Sanctuary',
      kapelė: 'Chapel',
      kripta: 'Crypt',
      altorius: 'Altar',
      tabernakulis: 'Tabernacle',
      šventasis: 'Saint',
      šventoji: 'Saint',
      palaimintasis: 'Blessed',
      kankinys: 'Martyr',
      maldos: 'Prayers',
      rožinis: 'Rosary',
      adoracija: 'Adoration',
      eucharistija: 'Eucharist',
      sakramentas: 'Sacrament',
      krikštas: 'Baptism',
      sutvirtinimas: 'Confirmation',
      išpažintis: 'Confession',
      santuoka: 'Matrimony',
      paskutinis_patepimas: 'Anointing of the Sick',
      katalikų_bažnyčia: 'Catholic Church',
      popiežius: 'Pope',
      kardinolas: 'Cardinal',
      arkivyskupas: 'Archbishop',
      vyskupas: 'Bishop',
      kunigas: 'Priest',
      diakonas: 'Deacon',
      vienuolis: 'Monk',
      vienuolė: 'Nun',
      pasninkas: 'Fast',
      pasninko_diena: 'Day of Fast',
      gavėnia: 'Lent',
      didžioji_savaitė: 'Holy Week',
      sekminės: 'Pentecost',
      trejybės_sekmadienis: 'Trinity Sunday',
      kūno_ir_kraujo_kristaus: 'Corpus Christi',
      švč_marijos_dangun_žengimo: 'Assumption of Mary',
      švč_marijos_gimimo: 'Nativity of Mary',
      švč_marijos_įvedimo_į_bažnyčią: 'Presentation of Mary',
      švč_trejybės: 'Holy Trinity',
      švč_jėzaus_širdies: 'Sacred Heart of Jesus',
      švč_marijos_širdies: 'Immaculate Heart of Mary',
      atlaidai: 'Patronal Feast',
      šventadienis: 'Sunday',
    },
  };

/**
 * Look up a liturgical term by its canonical Lithuanian key.
 * Falls back to the Lithuanian value when the target locale has no entry,
 * then falls back to the raw key string as a last resort.
 */
export function getLiturgicalTerm(key: string, locale: SupportedLocale): string {
  return (
    LITURGICAL_TERMS[locale][key] ??
    LITURGICAL_TERMS.lt[key] ??
    key
  );
}

/**
 * Returns `true` when `key` is a known liturgical term key.
 * Use this to decide whether to call DeepL or {@link getLiturgicalTerm}.
 */
export function isLiturgicalTerm(key: string): boolean {
  return key in LITURGICAL_TERMS.lt;
}
