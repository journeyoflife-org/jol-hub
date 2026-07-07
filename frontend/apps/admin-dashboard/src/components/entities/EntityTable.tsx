'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ExternalLink,
  Shield,
  RefreshCw,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useEntities, useCountry } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { Entity } from '@/types';
import { HierarchyBadge } from './HierarchyBadge';

// =============================================================================
// Types and Interfaces
// =============================================================================

interface EntityTableProps {
  country?: string;
  type?: string;
  status?: string;
  search?: string;
  onApprove?: (_entityId: string) => void;
}

// Extended entity type with canonical and sync status
type EntityRow = Entity & {
  canonicalStatus?: 'granted' | 'pending' | 'verification_pending' | 'rejected' | 'n_a';
  bitrix24Status?: 'synced' | 'error' | 'pending' | 'syncing';
  bitrix24Id?: string;
  gdprStatus?: 'compliant' | 'review' | 'non_compliant';
  hierarchy?: {
    tier: 'global' | 'country' | 'diocese' | 'parish';
    parentId?: string;
  parentName?: string;
  residency: string;
  };
};

// =============================================================================
// Column Definitions
// =============================================================================

const columnHelper = createColumnHelper<EntityRow>();

// Canonical status color mapping
const CANONICAL_STATUS_COLORS: Record<string, string> = {
  granted: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  verification_pending: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  n_a: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Bitrix24 sync status color mapping
const BITRIX_STATUS_COLORS: Record<string, string> = {
  synced: 'bg-green-500',
  error: 'bg-red-500',
  pending: 'bg-amber-500',
  syncing: 'bg-blue-500 animate-pulse',
};

// =============================================================================
// Main Entity Table Component
// Virtualized table supporting 10,000+ rows with TanStack Virtual
// GDPR Article 44: Country-scoped data display
// =============================================================================

export function EntityTable({
  country: countryFilter,
  type,
  status,
  search: initialSearch,
  onApprove: _onApprove,
}: EntityTableProps) {
  const router = useRouter();
  const parentRef = useRef<HTMLDivElement>(null);
  const { country: countryContext } = useCountry();
  
  // Get current country from context (GDPR residency)
  const currentCountry = countryFilter || countryContext?.code || 'lt';

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState(initialSearch || '');

  // Fetch entities
  const { data, isLoading, error, refetch } = useEntities({
    country: currentCountry,
    type,
    status,
    search: globalFilter,
  });

  const entities: EntityRow[] = data?.data ?? [];
  const totalCount = data?.total ?? entities.length;

  // =============================================================================
  // Column Definitions with TanStack Table
  // =============================================================================

  const columns = useMemo(() => [
    // Select column
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onChange={(e) => table.toggleAllRowsSelected(e.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),

    // Entity Name column
    columnHelper.accessor('name', {
      id: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -ml-2"
        >
          Entity Name
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.type}</p>
        </div>
      ),
    }),

    // Country column (GDPR residency)
    columnHelper.accessor('country', {
      id: 'country',
      header: 'Country',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.countryFlag}</span>
          <span className="text-sm">{row.original.country}</span>
        </div>
      ),
    }),

    // Canonical Status column
    columnHelper.accessor('canonicalStatus', {
      id: 'canonicalStatus',
      header: 'Canonical Status',
      cell: ({ row }) => {
        const status = row.original.canonicalStatus || 'n_a';
        const colorClass = CANONICAL_STATUS_COLORS[status] || CANONICAL_STATUS_COLORS.n_a;
        return (
          <span
            className={cn(
              'px-2 py-1 rounded text-xs font-medium border capitalize',
              colorClass
            )}
          >
            {status === 'n_a' ? 'Commercial' : status.replace('_', ' ')}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    }),

    // Bitrix24 Sync Status column
    columnHelper.accessor('bitrix24Status', {
      id: 'bitrix24Status',
      header: 'Bitrix24 Sync',
      cell: ({ row }) => {
        const status = row.original.bitrix24Status || 'pending';
        const dotColor = BITRIX_STATUS_COLORS[status] || BITRIX_STATUS_COLORS.pending;
        return (
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', dotColor)} />
            <span className="text-xs capitalize">{status}</span>
          </div>
        );
      },
    }),

    // GDPR Status column
    columnHelper.accessor('gdprStatus', {
      id: 'gdprStatus',
      header: 'GDPR',
      cell: ({ row }) => {
        const gdprStatus = row.original.gdprStatus || 'compliant';
        const isCompliant = gdprStatus === 'compliant';
        return (
          <span
            className={cn(
              'text-xs font-mono',
              isCompliant ? 'text-green-600' : 'text-amber-600'
            )}
          >
            {isCompliant ? '✓ Art. 25' : '⚠ Review'}
          </span>
        );
      },
    }),

    // Hierarchy column
    columnHelper.accessor('hierarchy', {
      id: 'hierarchy',
      header: 'Hierarchy',
      cell: ({ row }) => {
        const hierarchy = row.original.hierarchy;
        if (!hierarchy) return null;
        return <HierarchyBadge tier={hierarchy.tier} residency={hierarchy.residency} />;
      },
    }),

    // Status column
    columnHelper.accessor('status', {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    }),

    // Created column
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -ml-2"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    }),

    // Actions column
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/entities/${row.original.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {row.original.bitrix24Id && (
            <a
              href={`https://journeyoflife.bitrix24.ru/crm/company/details/${row.original.bitrix24Id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:underline text-xs flex items-center gap-1 ml-2"
            >
              <ExternalLink className="h-3 w-3" />
              Bitrix24
            </a>
          )}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
  ], [router]);

  // =============================================================================
  // TanStack Table Instance
  // =============================================================================

  const table = useReactTable({
    data: entities,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  // =============================================================================
  // Virtualization for 10,000+ Rows
  // Without this, 10,000 rows would crash the browser
  // With virtualization, we only render ~20 visible rows
  // Like a "conveyor belt" showing only what's in front of you
  // =============================================================================

  const { rows } = table.getRowModel();
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // 64px row height
    overscan: 10, // Render 10 extra rows for smooth scrolling
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // =============================================================================
  // Helper Functions
  // =============================================================================

  const getStatusBadge = (entityStatus: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      active: { className: 'bg-green-100 text-green-800', label: 'Active' },
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      suspended: { className: 'bg-red-100 text-red-800', label: 'Suspended' },
      archived: { className: 'bg-gray-100 text-gray-800', label: 'Archived' },
    };
    const variant = variants[entityStatus] ?? variants.active!;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const selectedCount = Object.keys(rowSelection).length;

  // =============================================================================
  // Loading and Error States
  // =============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load entities. Please try again.
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No entities found matching your criteria.
      </div>
    );
  }

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="space-y-4">
      {/* Table Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Entities: {currentCountry.toUpperCase()}</h3>
          <p className="text-sm text-muted-foreground">
            Showing {rows.length} of {totalCount} entities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          
          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    onClick={() => column.toggleVisibility(!column.getIsVisible())}
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      className="mr-2"
                    />
                    {column.id}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Refresh */}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Shield className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <Button variant="outline" size="sm">
            Bulk Approve
          </Button>
          <Button variant="outline" size="sm">
            Export Selected
          </Button>
          <Button variant="outline" size="sm">
            Sync to Bitrix24
          </Button>
        </div>
      )}

      {/* Virtualized Table Container */}
      <div className="bg-white rounded-lg border">
        <div
          ref={parentRef}
          className="h-[600px] overflow-auto"
        >
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold text-gray-600 border-b bg-gray-50"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody
              style={{
                height: `${totalSize}px`,
                position: 'relative',
              }}
            >
              {virtualRows.map((virtualRow: VirtualItem) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                
                return (
                  <TableRow
                    key={row.id}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      transform: `translateY(${virtualRow.start}px)`,
                      width: '100%',
                    }}
                    className={cn(
                      'hover:bg-gray-50',
                      row.getIsSelected() && 'bg-amber-50'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">/ page</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
