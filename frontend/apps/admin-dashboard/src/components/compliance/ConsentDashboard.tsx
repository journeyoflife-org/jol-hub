'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

// =============================================================================
// Consent Dashboard Component
// GDPR Article 7: Consent management dashboard
// =============================================================================

interface ConsentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  consentType: 'marketing' | 'analytics' | 'third_party' | 'cookies';
  status: 'granted' | 'withdrawn' | 'pending';
  grantedAt: string;
  withdrawnAt?: string;
  ipAddress: string;
  country: string;
  version: string;
}

// Mock consent data
const MOCK_CONSENTS: ConsentRecord[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    consentType: 'marketing',
    status: 'granted',
    grantedAt: '2024-01-15T10:30:00Z',
    ipAddress: '192.168.1.1',
    country: 'LT',
    version: 'v1.2',
  },
  {
    id: '2',
    userId: 'user-2',
    userName: 'Jane Smith',
    userEmail: 'jane@example.com',
    consentType: 'analytics',
    status: 'granted',
    grantedAt: '2024-01-14T14:20:00Z',
    ipAddress: '192.168.1.2',
    country: 'DE',
    version: 'v1.2',
  },
  {
    id: '3',
    userId: 'user-3',
    userName: 'Bob Wilson',
    userEmail: 'bob@example.com',
    consentType: 'cookies',
    status: 'withdrawn',
    grantedAt: '2024-01-10T09:15:00Z',
    withdrawnAt: '2024-01-20T16:45:00Z',
    ipAddress: '192.168.1.3',
    country: 'FR',
    version: 'v1.1',
  },
];

interface ConsentDashboardProps {
  onExport?: () => void;
}

export function ConsentDashboard({ onExport }: ConsentDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading] = useState(false);

  // Filter consents
  const filteredConsents = MOCK_CONSENTS.filter((consent) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !consent.userName.toLowerCase().includes(query) &&
        !consent.userEmail.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedType && consent.consentType !== selectedType) return false;
    if (selectedStatus && consent.status !== selectedStatus) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: MOCK_CONSENTS.length,
    granted: MOCK_CONSENTS.filter((c) => c.status === 'granted').length,
    withdrawn: MOCK_CONSENTS.filter((c) => c.status === 'withdrawn').length,
    pending: MOCK_CONSENTS.filter((c) => c.status === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: typeof CheckCircle }> = {
      granted: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      withdrawn: { className: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    };
    const variant = variants[status] ?? variants.pending!;
    const Icon = variant.icon;
    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      marketing: 'Marketing',
      analytics: 'Analytics',
      third_party: 'Third Party',
      cookies: 'Cookies',
    };
    return (
      <Badge variant="outline">
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Consents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.granted}</div>
            <p className="text-sm text-muted-foreground">Granted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.withdrawn}</div>
            <p className="text-sm text-muted-foreground">Withdrawn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Consent Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consent Records</CardTitle>
              <CardDescription>
                GDPR Article 7: Manage user consent records
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Types</option>
              <option value="marketing">Marketing</option>
              <option value="analytics">Analytics</option>
              <option value="cookies">Cookies</option>
              <option value="third_party">Third Party</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="granted">Granted</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead>Withdrawn</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredConsents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No consent records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredConsents.map((consent) => (
                  <TableRow key={consent.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{consent.userName}</p>
                        <p className="text-sm text-muted-foreground">{consent.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(consent.consentType)}</TableCell>
                    <TableCell>{getStatusBadge(consent.status)}</TableCell>
                    <TableCell>
                      {format(new Date(consent.grantedAt), 'PPp')}
                    </TableCell>
                    <TableCell>
                      {consent.withdrawnAt
                        ? format(new Date(consent.withdrawnAt), 'PPp')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{consent.country}</Badge>
                    </TableCell>
                    <TableCell>{consent.version}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* GDPR Notice */}
      <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="py-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>GDPR Article 7:</strong> Consent must be freely given, specific, informed,
            and unambiguous. Users have the right to withdraw consent at any time, and the
            process for withdrawal must be as easy as giving consent.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
