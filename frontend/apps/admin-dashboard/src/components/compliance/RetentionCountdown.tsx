'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  AlertTriangle,
  Trash2,
  Archive,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Retention Countdown Component
// Auto-delete timers for GDPR compliance
// GDPR Article 17: Right to erasure implementation
// =============================================================================

interface RetentionCountdownProps {
  title: string;
  daysRemaining: number;
  recordCount: number;
  status: 'healthy' | 'warning' | 'critical';
  showDetails?: boolean;
  onDelete?: () => void;
  onExtend?: () => void;
}

export function RetentionCountdown({
  title,
  daysRemaining,
  recordCount,
  status,
  showDetails = false,
  onDelete,
  onExtend,
}: RetentionCountdownProps) {
  const [countdown] = useState(daysRemaining);
  const [isDeleting, setIsDeleting] = useState(false);

  // Simulate countdown (in production, this would be based on actual data)
  useEffect(() => {
    // No real countdown for demo purposes
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'critical':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-950/20',
          borderColor: 'border-red-500/50',
          progressColor: '[&>div]:bg-red-500',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: AlertTriangle,
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-950/20',
          borderColor: 'border-yellow-500/50',
          progressColor: '[&>div]:bg-yellow-500',
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: Clock,
        };
      default:
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-950/20',
          borderColor: 'border-green-500/50',
          progressColor: '[&>div]:bg-green-500',
          badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: Archive,
        };
    }
  };

  const config = getStatusConfig();
  if (!config) return null;
  const Icon = config.icon;

  const progressValue = Math.min((countdown / 365) * 100, 100);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={cn('border-2', config.borderColor)}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', config.color)} />
            <span className="font-medium">{title}</span>
          </div>
          <Badge className={config.badge}>
            {countdown} days
          </Badge>
        </div>

        <div className="space-y-2">
          {/* Progress Bar */}
          <Progress
            value={progressValue}
            className={cn('h-2', config.progressColor)}
          />

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {recordCount.toLocaleString()} records
            </span>
            <span className={config.color}>
              {countdown <= 0
                ? 'Scheduled for deletion'
                : `${countdown} days remaining`}
            </span>
          </div>
        </div>

        {/* Details & Actions */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Retention policy: 365 days from last activity
              </span>
            </div>

            <div className="flex items-center gap-2">
              {status === 'critical' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Now
                </Button>
              )}
              {onExtend && (
                <Button variant="outline" size="sm" onClick={onExtend}>
                  Extend Retention
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


