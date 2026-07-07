'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Info,
} from 'lucide-react';
import { ENTITY_TYPES } from '@/lib/entityTypes';
import type { FieldMapping } from '@/types';

// =============================================================================
// Field Mapper Component
// Custom field mapping per entity type for Bitrix24 sync
// GDPR Article 44: Field-level data mapping configuration
// =============================================================================

interface FieldMapperProps {
  mappings: FieldMapping[];
  onSave: (mappings: FieldMapping[]) => void;
  isLoading?: boolean;
}

// Bitrix24 available fields
const BITRIX24_FIELDS = [
  { id: 'TITLE', name: 'Title', type: 'string' },
  { id: 'COMPANY_TITLE', name: 'Company Name', type: 'string' },
  { id: 'NAME', name: 'First Name', type: 'string' },
  { id: 'LAST_NAME', name: 'Last Name', type: 'string' },
  { id: 'EMAIL', name: 'Email', type: 'email' },
  { id: 'PHONE', name: 'Phone', type: 'phone' },
  { id: 'ADDRESS', name: 'Address', type: 'string' },
  { id: 'ADDRESS_CITY', name: 'City', type: 'string' },
  { id: 'ADDRESS_COUNTRY', name: 'Country', type: 'string' },
  { id: 'COMMENTS', name: 'Comments', type: 'text' },
  { id: 'UF_CRM_123456', name: 'Custom Field 1', type: 'string' },
  { id: 'UF_CRM_789012', name: 'Custom Field 2', type: 'string' },
];

// JOL-HUB entity fields
const JOL_HUB_FIELDS = [
  { id: 'name', name: 'Entity Name', type: 'string' },
  { id: 'email', name: 'Email', type: 'email' },
  { id: 'phone', name: 'Phone', type: 'phone' },
  { id: 'address', name: 'Address', type: 'string' },
  { id: 'city', name: 'City', type: 'string' },
  { id: 'country', name: 'Country', type: 'string' },
  { id: 'description', name: 'Description', type: 'text' },
  { id: 'website', name: 'Website', type: 'url' },
  { id: 'vatNumber', name: 'VAT Number', type: 'string' },
  { id: 'diocese', name: 'Diocese', type: 'string' },
];

export function FieldMapper({
  mappings,
  onSave,
  isLoading = false,
}: FieldMapperProps) {
  const [localMappings, setLocalMappings] = useState<FieldMapping[]>(mappings);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  const addMapping = () => {
    const newMapping: FieldMapping = {
      id: `mapping-${Date.now()}`,
      entityType: selectedEntityType || 'parish',
      localField: '',
      remoteField: '',
      syncDirection: 'bidirectional',
      transform: null,
      enabled: true,
    };
    setLocalMappings([...localMappings, newMapping]);
    setHasChanges(true);
  };

  const updateMapping = (id: string, updates: Partial<FieldMapping>) => {
    setLocalMappings(
      localMappings.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      )
    );
    setHasChanges(true);
  };

  const removeMapping = (id: string) => {
    setLocalMappings(localMappings.filter((m) => m.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localMappings);
    setHasChanges(false);
  };

  const filteredMappings = selectedEntityType
    ? localMappings.filter((m) => m.entityType === selectedEntityType)
    : localMappings;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Field Mapping
            </CardTitle>
            <CardDescription>
              Configure field mappings between JOL-HUB and Bitrix24
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary">Unsaved changes</Badge>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Mappings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entity Type Filter */}
        <div className="flex items-center gap-4">
          <Label htmlFor="entityType">Filter by Entity Type</Label>
          <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All entity types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All entity types</SelectItem>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mapping Table */}
        <div className="border rounded-lg">
          <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 text-sm font-medium">
            <div>Entity Type</div>
            <div>JOL-HUB Field</div>
            <div>Direction</div>
            <div>Bitrix24 Field</div>
            <div>Enabled</div>
            <div>Actions</div>
          </div>

          {filteredMappings.map((mapping) => (
            <div
              key={mapping.id}
              className="grid grid-cols-6 gap-4 p-4 border-t items-center"
            >
              {/* Entity Type */}
              <Select
                value={mapping.entityType}
                onValueChange={(v) => updateMapping(mapping.id, { entityType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Local Field */}
              <Select
                value={mapping.localField}
                onValueChange={(v) => updateMapping(mapping.id, { localField: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {JOL_HUB_FIELDS.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sync Direction */}
              <Select
                value={mapping.syncDirection}
                onValueChange={(v) =>
                  updateMapping(mapping.id, {
                    syncDirection: v as 'bidirectional' | 'local-to-remote' | 'remote-to-local',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bidirectional">↔️ Bidirectional</SelectItem>
                  <SelectItem value="local-to-remote">→ To Bitrix24</SelectItem>
                  <SelectItem value="remote-to-local">← From Bitrix24</SelectItem>
                </SelectContent>
              </Select>

              {/* Remote Field */}
              <Select
                value={mapping.remoteField}
                onValueChange={(v) => updateMapping(mapping.id, { remoteField: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {BITRIX24_FIELDS.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Enabled */}
              <div className="flex justify-center">
                <Switch
                  checked={mapping.enabled}
                  onCheckedChange={(checked) =>
                    updateMapping(mapping.id, { enabled: checked })
                  }
                />
              </div>

              {/* Actions */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMapping(mapping.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {filteredMappings.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No field mappings configured. Click "Add Mapping" to create one.
            </div>
          )}
        </div>

        {/* Add Mapping Button */}
        <Button variant="outline" onClick={addMapping} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>

        {/* Info Notice */}
        <div className="flex items-start gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-sm">
          <Info className="h-4 w-4 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Field Mapping Configuration
            </p>
            <p className="text-blue-600 dark:text-blue-400 mt-1">
              Configure how fields are mapped between JOL-HUB and Bitrix24.
              "Bidirectional" sync will update both systems when either changes.
              "To Bitrix24" only pushes local changes to the CRM.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
