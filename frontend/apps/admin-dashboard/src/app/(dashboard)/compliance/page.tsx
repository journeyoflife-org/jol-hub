'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataResidencyMap } from '@/components/compliance/DataResidencyMap';
import { ConsentDashboard } from '@/components/compliance/ConsentDashboard';
import { RetentionCountdown } from '@/components/compliance/RetentionCountdown';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Database,
  Lock,
} from 'lucide-react';
import { useGDPRStats, useComplianceAudit } from '@/lib/hooks';
import { format } from 'date-fns';

// =============================================================================
// Compliance Page
// GDPR Dashboard with data residency map and consent management
// Canon Law CIC 1300-1307: Compliance tracking for Catholic entities
// SOC2 CC6.1: Security controls monitoring
// =============================================================================

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: gdprStats, refetch } = useGDPRStats();
  const { data: auditLogs } = useComplianceAudit();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance</h1>
          <p className="text-muted-foreground">
            GDPR Article 44 • SOC2 CC6.1 • Canon Law CIC 1300-1307
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GDPR Status</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Compliant</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Article 44 data residency enforced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SOC2 Status</CardTitle>
            <Lock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Compliant</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              CC6.1 controls verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canon Law</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              CIC 1300-1307 compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Subjects</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gdprStats?.dataSubjects?.toLocaleString() ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Protected records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-residency">Data Residency</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* GDPR Overview */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Consent Summary</CardTitle>
                <CardDescription>GDPR Article 7 consent status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Consents</span>
                    <Badge variant="default">{gdprStats?.activeConsents ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Consent</span>
                    <Badge variant="secondary">{gdprStats?.pendingConsents ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Withdrawn Consents</span>
                    <Badge variant="outline">{gdprStats?.withdrawnConsents ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Subject Requests</span>
                    <Badge variant="destructive">{gdprStats?.pendingRequests ?? 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention Status</CardTitle>
                <CardDescription>Records approaching retention limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RetentionCountdown
                    title="Parish Records"
                    daysRemaining={365}
                    recordCount={1200}
                    status="healthy"
                  />
                  <RetentionCountdown
                    title="Donation Records"
                    daysRemaining={180}
                    recordCount={450}
                    status="warning"
                  />
                  <RetentionCountdown
                    title="User Data"
                    daysRemaining={90}
                    recordCount={89}
                    status="critical"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Alerts */}
          {(gdprStats?.pendingRequests ?? 0) > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="flex items-center gap-4 py-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    {gdprStats?.pendingRequests} pending data subject requests
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    GDPR requires response within 30 days
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Requests
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data-residency">
          <Card>
            <CardHeader>
              <CardTitle>Data Residency Map</CardTitle>
              <CardDescription>
                GDPR Article 44: Visual EU map with data locks per country
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataResidencyMap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent">
          <ConsentDashboard />
        </TabsContent>

        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
              <CardDescription>
                Automated data deletion timers per GDPR requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RetentionCountdown
                title="Parish Registration Data"
                daysRemaining={365}
                recordCount={12500}
                status="healthy"
                showDetails
              />
              <RetentionCountdown
                title="Donation Transaction Records"
                daysRemaining={2555}
                recordCount={45000}
                status="healthy"
                showDetails
              />
              <RetentionCountdown
                title="User Activity Logs"
                daysRemaining={90}
                recordCount={890}
                status="warning"
                showDetails
              />
              <RetentionCountdown
                title="Session Data"
                daysRemaining={30}
                recordCount={15000}
                status="healthy"
                showDetails
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Audit Log</CardTitle>
              <CardDescription>
                All GDPR-related actions and data access events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs?.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${
                      log.type === 'consent' ? 'bg-blue-500' :
                      log.type === 'deletion' ? 'bg-red-500' :
                      log.type === 'export' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.user} • {format(new Date(log.timestamp), 'PPp')}
                      </p>
                    </div>
                    <Badge variant="outline">{log.country}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
