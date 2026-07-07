'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityForm } from '@/components/entities/EntityForm';
import { CanonicalApproval } from '@/components/entities/CanonicalApproval';
import { CommercialVerify } from '@/components/entities/CommercialVerify';
import { SyncStatus } from '@/components/bitrix24/SyncStatus';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  Store,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useEntity } from '@/lib/hooks';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// =============================================================================
// Entity Detail Page
// Shows entity details with tabs for editing, compliance, and sync status
// Canon Law CIC 1300-1307: Canonical approval workflow for Catholic entities
// =============================================================================

export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;
  
  const { data: entity, isLoading, error, refetch } = useEntity(entityId);
  const [isEditing, setIsEditing] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading entity details...</p>
        </div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="p-6">
        <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">Entity not found</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                The requested entity could not be loaded.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard/entities')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Entities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCatholic = entity.category === 'catholic';
  const isCommercial = entity.category === 'commercial';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/entities')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{entity.name}</h1>
              <Badge
                variant={entity.status === 'active' ? 'default' : 'secondary'}
                className={cn(
                  entity.status === 'active' && 'bg-green-100 text-green-800',
                  entity.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                  entity.status === 'suspended' && 'bg-red-100 text-red-800'
                )}
              >
                {entity.status}
              </Badge>
              {isCatholic && (
                <Badge className="bg-liturgical-gold text-black">
                  ✝ Catholic
                </Badge>
              )}
              {isCommercial && (
                <Badge variant="outline" className="border-blue-500 text-blue-600">
                  🏢 Commercial
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {entity.type} • {entity.country} • Created {format(new Date(entity.createdAt), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCatholic && entity.status === 'pending' && (
            <Button onClick={() => setShowApprovalDialog(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Canonical Approval
            </Button>
          )}
          {isCommercial && !entity.verified && (
            <Button variant="outline" onClick={() => setShowVerifyDialog(true)}>
              <Store className="h-4 w-4 mr-2" />
              Verify Business
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="sync">Bitrix24 Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Entity Info Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{entity.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{entity.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{entity.country}</p>
                </div>
                {entity.diocese && (
                  <div>
                    <p className="text-sm text-muted-foreground">Diocese</p>
                    <p className="font-medium">{entity.diocese}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{entity.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{entity.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{entity.address || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">GDPR Compliant</span>
                  <Badge variant={entity.gdprCompliant ? 'default' : 'destructive'}>
                    {entity.gdprCompliant ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {isCatholic && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Canonically Approved</span>
                    <Badge variant={entity.canonicalApproval ? 'default' : 'secondary'}>
                      {entity.canonicalApproval ? 'Yes' : 'Pending'}
                    </Badge>
                  </div>
                )}
                {isCommercial && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">VAT Verified</span>
                    <Badge variant={entity.vatVerified ? 'default' : 'secondary'}>
                      {entity.vatVerified ? 'Yes' : 'Pending'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Entity</CardTitle>
              <CardDescription>
                Modify entity information. Changes are logged for audit purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntityForm
                entity={entity}
                onSubmit={(data) => {
                  console.log('Update entity:', data);
                  setIsEditing(false);
                  refetch();
                }}
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance History</CardTitle>
              <CardDescription>
                GDPR Article 44 and Canon Law compliance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Compliance history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <SyncStatus entityId={entityId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showApprovalDialog && (
        <CanonicalApproval
          entityId={entityId}
          open={showApprovalDialog}
          onClose={() => setShowApprovalDialog(false)}
          onApproved={() => {
            setShowApprovalDialog(false);
            refetch();
          }}
        />
      )}
      
      {showVerifyDialog && (
        <CommercialVerify
          entityId={entityId}
          open={showVerifyDialog}
          onClose={() => setShowVerifyDialog(false)}
          onVerified={() => {
            setShowVerifyDialog(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
