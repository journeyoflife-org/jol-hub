/**
 * NewsCard — article teaser with date, author, category, excerpt and
 * read time.
 */
import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import { Badge } from '../../primitives/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../primitives/card';
import type { NewsCardProps } from './NewsCard.types';

export function NewsCard({
  title,
  publishedAt,
  dateLabel,
  author,
  category,
  excerpt,
  readTime,
  href,
  tenant,
  className,
}: NewsCardProps) {
  return (
    <Card variant={href ? 'interactive' : 'default'} tenant={tenant} className={className}>
      <CardHeader>
        {category && (
          <Badge variant="vertical" tenant={tenant} size="sm">
            {category}
          </Badge>
        )}
        <CardTitle>
          {href ? (
            <a href={href} className={cn('focus-ring rounded-sm', accentTextClass(tenant))}>
              {title}
            </a>
          ) : (
            title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{excerpt}</p>
      </CardContent>
      <CardFooter className="justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          <time dateTime={publishedAt}>{dateLabel}</time>
          {author && <span> · {author}</span>}
        </span>
        {readTime && <span>{readTime}</span>}
      </CardFooter>
    </Card>
  );
}
