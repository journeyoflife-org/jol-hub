/**
 * LiturgicalCalendar Component
 * Shows current liturgical season and feast days
 * Automatic calculation based on liturgical calendar rules
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Calendar, Church, Leaf, Flame, Star } from 'lucide-react';

// lucide-react v0.358 does not export Cross — use an inline SVG cross icon
function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 2v6H5v4h6v10h2V12h6V8h-6V2z" />
    </svg>
  );
}

// =============================================================================
// TYPES
// =============================================================================

export interface LiturgicalCalendarProps {
  date?: Date;
  className?: string;
}

export interface LiturgicalSeason {
  name: string;
  color: string;
  icon: React.ReactNode;
  description: string;
}

export interface FeastDay {
  date: Date;
  name: string;
  type: 'solemnity' | 'feast' | 'memorial' | 'optional';
}

// =============================================================================
// LITURGICAL CALCULATION
// =============================================================================

function calculateEaster(year: number): Date {
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

function getLiturgicalSeason(date: Date): LiturgicalSeason {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const easter = calculateEaster(year);
  const christmas = new Date(year, 11, 25);
  const epiphany = new Date(year, 0, 6);
  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);
  const palmSunday = new Date(easter);
  palmSunday.setDate(easter.getDate() - 7);
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  const adventStart = new Date(christmas);
  adventStart.setDate(christmas.getDate() - 22 - ((christmas.getDay() + 6) % 7));

  const time = date.getTime();

  if (time >= ashWednesday.getTime() && time < palmSunday.getTime()) {
    return {
      name: 'Lent',
      color: 'purple',
      icon: <Leaf className="h-5 w-5" />,
      description: 'Period of fasting and preparation for Easter',
    };
  }

  if (time >= palmSunday.getTime() && time < easter.getTime()) {
    return {
      name: 'Holy Week',
      color: 'red',
      icon: <CrossIcon className="h-5 w-5" />,
      description: 'The final week of Lent, commemorating the Passion of Christ',
    };
  }

  if (time >= easter.getTime() && time < pentecost.getTime()) {
    return {
      name: 'Easter',
      color: 'white',
      icon: <Flame className="h-5 w-5" />,
      description: 'The season of celebrating Christ\'s resurrection',
    };
  }

  if (time >= adventStart.getTime() && time < christmas.getTime()) {
    return {
      name: 'Advent',
      color: 'purple',
      icon: <Star className="h-5 w-5" />,
      description: 'Preparation for the celebration of Christ\'s birth',
    };
  }

  if (
    (month === 11 && day >= 25) ||
    (month === 0 && day <= 6) ||
    (time >= christmas.getTime() && time < epiphany.getTime())
  ) {
    return {
      name: 'Christmas',
      color: 'white',
      icon: <Star className="h-5 w-5" />,
      description: 'Celebration of Christ\'s birth',
    };
  }

  return {
    name: 'Ordinary Time',
    color: 'green',
    icon: <Church className="h-5 w-5" />,
    description: 'The time outside of the major liturgical seasons',
  };
}

function getUpcomingFeasts(date: Date): FeastDay[] {
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

function getColorClass(color: string): string {
  const colors: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    white: 'bg-slate-100 text-slate-800 border-slate-200',
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  return colors[color] ?? colors.green ?? 'bg-emerald-100 text-emerald-800 border-emerald-200';
}

function getFeastBadgeVariant(type: FeastDay['type']): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<FeastDay['type'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    solemnity: 'default',
    feast: 'secondary',
    memorial: 'outline',
    optional: 'outline',
  };
  return variants[type] ?? 'outline';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LiturgicalCalendar({
  date = new Date(),
  className = '',
}: LiturgicalCalendarProps): JSX.Element {
  const season = useMemo(() => getLiturgicalSeason(date), [date]);
  const upcomingFeasts = useMemo(() => getUpcomingFeasts(date), [date]);

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString('lt-LT', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Liturgical Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Season */}
        <div className={`rounded-lg border p-4 ${getColorClass(season.color)}`}>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/50 p-2">{season.icon}</div>
            <div>
              <h3 className="font-semibold">{season.name}</h3>
              <p className="text-sm opacity-80">{season.description}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Feasts */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Upcoming Feast Days
          </h4>
          <div className="space-y-2">
            {upcomingFeasts.map((feast, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <span className="font-medium">{feast.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(feast.date)}
                  </span>
                  <Badge variant={getFeastBadgeVariant(feast.type)}>
                    {feast.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
