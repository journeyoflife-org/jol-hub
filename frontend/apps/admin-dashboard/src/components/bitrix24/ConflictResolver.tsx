'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, Loader2, GitMerge } from 'lucide-react';
import type { Bitrix24Conflict } from '@/types';

// =============================================================================
// Conflict Resolver Component
// Manual merge UI for Bitrix24 sync conflicts
// GDPR Article 44: Conflict resolution with audit trail
// =============================================================================

interface ConflictResolverProps {
  conflicts: Bitrix24Conflict[];
  onResolve: (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    mergedData?: Record<string, unknown>
  ) => void;
  isLoading?: boolean;
}

export function ConflictResolver({
  conflicts,
  onResolve,
  isLoading = false,
}: ConflictResolverProps) {
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'local' | 'remote' | 'merge' | null>(null);
  const [mergedData, setMergedData] = useState<string>('');

  const handleResolve = () => {
    if (!selectedConflict || !resolution) return;

    const parsedMergedData = resolution === 'merge' ? JSON.parse(mergedData || '{}') : undefined;
    onResolve(selectedConflict, resolution, parsedMergedData);

    setSelectedConflict(null);
    setResolution(null);
    setMergedData('');
  };

  const currentConflict = conflicts.find((c) => c.id === selectedConflict);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sync Conflicts</CardTitle>
            <CardDescription>
              Resolve data conflicts between local and Bitrix24 data
            </CardDescription>
          </div>
          <Badge variant="destructive">{conflicts.length} conflicts</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {conflicts.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">No Conflicts</p>
            <p className="text-muted-foreground text-sm">
              All data is synchronized without conflicts
            </p>
          </div>
        ) : selectedConflict && currentConflict ? (
          <div className="space-y-4">
            {/* Conflict Header */}
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedConflict(null);
                  setResolution(null);
                }}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to list
              </Button>
            </div>

            {/* Conflict Details */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Local Version */}
              <div className="rounded-lg border-2 border-blue-500/50 bg-blue-50/50 p-4 dark:bg-blue-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="font-medium">Local Version</span>
                </div>
                <div className="space-y-2 text-sm">
                  {Object.entries(currentConflict.localData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant={resolution === 'local' ? 'default' : 'outline'}
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setResolution('local')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Keep Local
                </Button>
              </div>

              {/* Remote Version */}
              <div className="rounded-lg border-2 border-purple-500/50 bg-purple-50/50 p-4 dark:bg-purple-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="font-medium">Bitrix24 Version</span>
                </div>
                <div className="space-y-2 text-sm">
                  {Object.entries(currentConflict.remoteData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant={resolution === 'remote' ? 'default' : 'outline'}
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setResolution('remote')}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Accept Remote
                </Button>
              </div>
            </div>

            {/* Merge Option */}
            <div className="rounded-lg border-2 border-green-500/50 bg-green-50/50 p-4 dark:bg-green-950/20">
              <div className="mb-3 flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-green-500" />
                <span className="font-medium">Manual Merge</span>
              </div>
              <Textarea
                placeholder={JSON.stringify(currentConflict.localData, null, 2)}
                value={mergedData}
                onChange={(e) => {
                  setMergedData(e.target.value);
                  setResolution('merge');
                }}
                className="font-mono text-sm"
                rows={6}
              />
              <Button
                variant={resolution === 'merge' ? 'default' : 'outline'}
                size="sm"
                className="mt-3 w-full"
                onClick={() => setResolution('merge')}
              >
                <GitMerge className="mr-2 h-4 w-4" />
                Merge Manually
              </Button>
            </div>

            {/* Resolve Button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedConflict(null);
                  setResolution(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleResolve} disabled={!resolution || isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Resolve Conflict
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="bg-muted/50 hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-3"
                onClick={() => setSelectedConflict(conflict.id)}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">
                      {conflict.entityType}: {conflict.entityName}
                    </p>
                    <p className="text-muted-foreground text-sm">{conflict.field} conflict</p>
                  </div>
                </div>
                <Badge variant="outline">
                  {new Date(conflict.detectedAt).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
