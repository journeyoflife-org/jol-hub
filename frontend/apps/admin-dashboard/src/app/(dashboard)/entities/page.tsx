'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { EntityTable } from '@/components/entities/EntityTable';
import { CanonicalApproval } from '@/components/entities/CanonicalApproval';
import { Plus, Filter, Download, Upload } from 'lucide-react';
import { EU_COUNTRIES } from '@/lib/countries';
import { ENTITY_TYPES } from '@/lib/entityTypes';

// =============================================================================
// Entities List Page
// TanStack Table for virtualized list (10k rows support)
// GDPR Article 44: Country-scoped entity visibility
// =============================================================================

export default function EntitiesPage() {
  const searchParams = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState<string>(
    searchParams.get('country') || ''
  );
  const [selectedType, setSelectedType] = useState<string>(
    searchParams.get('type') || ''
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get('status') || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const handleApproveEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    setShowApprovalDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entities</h1>
          <p className="text-muted-foreground">
            Manage parishes, dioceses, and commercial entities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Country Filter - GDPR Article 44 */}
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {EU_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Entity Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entity Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Entities</CardTitle>
          <CardDescription>
            Virtualized table supporting 10,000+ rows with real-time filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EntityTable
            country={selectedCountry}
            type={selectedType}
            status={selectedStatus}
            search={searchQuery}
            onApprove={handleApproveEntity}
          />
        </CardContent>
      </Card>

      {/* Canonical Approval Dialog */}
      {showApprovalDialog && selectedEntityId && (
        <CanonicalApproval
          entityId={selectedEntityId}
          open={showApprovalDialog}
          onClose={() => {
            setShowApprovalDialog(false);
            setSelectedEntityId(null);
          }}
          onApproved={() => {
            setShowApprovalDialog(false);
            setSelectedEntityId(null);
            // Refresh table data
          }}
        />
      )}
    </div>
  );
}
