/**
 * Liturgical calendar computation — Easter algorithm, feast table and
 * display-class helpers. Extracted from liturgical-calendar.tsx (STEP 3
 * 250-line rule). Pure logic: no JSX, trivially testable.
 */

export interface FeastDay {
  date: Date;
  name: string;
  type: 'solemnity' | 'feast' | 'memorial' | 'optional';
}

/** Gregorian Easter — anonymous Computus algorithm. */
export function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/** Next three solemnities on or after the given date. */
export function getUpcomingFeasts(date: Date): FeastDay[] {
  const year = date.getFullYear();
  const feasts: FeastDay[] = [
    { date: new Date(year, 0, 1), name: 'Mary, Mother of God', type: 'solemnity' },
    { date: new Date(year, 0, 6), name: 'Epiphany', type: 'solemnity' },
    { date: calculateEaster(year), name: 'Easter Sunday', type: 'solemnity' },
    { date: new Date(year, 7, 15), name: 'Assumption of Mary', type: 'solemnity' },
    { date: new Date(year, 10, 1), name: 'All Saints', type: 'solemnity' },
    { date: new Date(year, 11, 8), name: 'Immaculate Conception', type: 'solemnity' },
    { date: new Date(year, 11, 25), name: 'Christmas', type: 'solemnity' },
  ];

  return feasts
    .filter((f) => f.date >= date)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);
}

export function getColorClass(color: string): string {
  const colors: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    white: 'bg-slate-100 text-slate-800 border-slate-200',
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  return colors[color] ?? colors.green ?? 'bg-emerald-100 text-emerald-800 border-emerald-200';
}

export function getFeastBadgeVariant(type: FeastDay['type']): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<FeastDay['type'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    solemnity: 'default',
    feast: 'secondary',
    memorial: 'outline',
    optional: 'outline',
  };
  return variants[type] ?? 'outline';
}
