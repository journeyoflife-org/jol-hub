/**
 * CourseList — course listing for education pages (page package 24).
 * Schedule/level meta carry sr-only labels (programmatic association,
 * DS-A11Y-10); labels are externalized strings (LT/EN/RU catalogs).
 */
'use client';

import { Calendar, GraduationCap } from 'lucide-react';
import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import { Card, CardContent, CardHeader, CardTitle } from '../../primitives/card';
import type { CourseListProps } from './CourseList.types';

export function CourseList({ items, tenant, className }: CourseListProps) {
  const t = useTranslations('collections');

  if (items.length === 0) {
    return <p className={cn('text-sm text-neutral-600 dark:text-neutral-300', className)}>{t('emptyCourses')}</p>;
  }

  return (
    <ul className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {items.map((course) => (
        <li key={course.title} className="list-none">
          <Card variant={course.href ? 'interactive' : 'default'} tenant={tenant} className="h-full">
            <CardHeader>
              <CardTitle>
                {course.href ? (
                  <a
                    href={course.href}
                    className={cn('focus-ring rounded-sm', accentTextClass(tenant))}
                  >
                    {course.title}
                  </a>
                ) : (
                  course.title
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              {course.description && <p>{course.description}</p>}
              {course.schedule && (
                <p className="flex items-center gap-2">
                  <Calendar aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="sr-only">{t('courseScheduleLabel')}: </span>
                  <span>{course.schedule}</span>
                </p>
              )}
              {course.level && (
                <p className="flex items-center gap-2">
                  <GraduationCap aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="sr-only">{t('courseLevelLabel')}: </span>
                  <span>{course.level}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
