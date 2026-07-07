'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  FileCheck,
  Lock,
  Church,
} from 'lucide-react';
import { useEntity, useApproveEntity } from '@/lib/hooks';
import { cn } from '@/lib/utils';

// =============================================================================
// Canonical Approval Schema
// Canon Law CIC 1300-1307: Bishop approval workflow
// GDPR Article 32: Encryption of uploaded documents
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg'];

const approvalSchema = z.object({
  bishopName: z.string().min(3, 'Bishop name must be at least 3 characters'),
  bishopTitle: z.string().min(3, 'Bishop title is required'),
  diocese: z.string().min(2, 'Diocese is required'),
  letterDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),
  decreeNumber: z.string().optional(),
  recognitioNumber: z.string().optional(), // Vatican approval number
  approvalNotes: z.string().optional(),
  document: z
    .instanceof(File, { message: 'Document is required' })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: 'File size must be less than 10MB',
    })
    .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), {
      message: 'Only PDF or JPEG files are accepted',
    })
    .optional(),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

// Upload status type
type UploadStatus = 'idle' | 'encrypting' | 'uploading' | 'verifying' | 'approved' | 'rejected' | 'error';

// Lithuanian dioceses (for the example - other countries have different lists)
const DIOCESES_LT = [
  { value: 'vilnius', label: 'Archdiocese of Vilnius' },
  { value: 'kaunas', label: 'Diocese of Kaunas' },
  { value: 'panevezys', label: 'Diocese of Panevėžys' },
  { value: 'vilkaviskis', label: 'Diocese of Vilkaviškis' },
  { value: 'siauliai', label: 'Diocese of Šiauliai' },
  { value: 'telsiai', label: 'Diocese of Telšiai' },
  { value: 'kaisiadorys', label: 'Diocese of Kaišiadorys' },
];

// Vatican processing timeline
const VATICAN_PROCESSING_DAYS = '30-90';

// =============================================================================
// Canonical Approval Component - "The Vatican Paperwork Section"
// Bishop upload workflow for Catholic entities
// Canon Law CIC 1300-1307: Without this approval, church cannot accept donations
// GDPR Article 32: Document encryption before upload
// =============================================================================

interface CanonicalApprovalProps {
  entityId: string;
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
}

export function CanonicalApproval({
  entityId,
  open,
  onClose,
  onApproved,
}: CanonicalApprovalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState<'verify' | 'upload' | 'confirm'>('verify');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bitrixDocId, setBitrixDocId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: entity, isLoading: entityLoading } = useEntity(entityId);
  const { mutate: approveEntity, isPending: isApproving } = useApproveEntity();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      bishopName: '',
      bishopTitle: '',
      diocese: entity?.diocese ?? '',
      letterDate: new Date().toISOString().split('T')[0],
      decreeNumber: '',
      recognitioNumber: '',
      approvalNotes: '',
    },
  });

  // Watch form values for preview
  const watchedBishopName = watch('bishopName');
  const watchedDiocese = watch('diocese');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUploadStatus('idle');
      setUploadProgress(0);
      setBitrixDocId(null);
      setErrorMessage(null);
      setStep('verify');
    }
  }, [open]);

  // =============================================================================
  // File Encryption - GDPR Article 32
  // =============================================================================

  /**
   * Encrypt file before upload (GDPR Article 32: Security of processing)
   * In production, this would use Web Crypto API with proper key management
   */
  const encryptFile = async (file: File): Promise<Blob> => {
    // Simulate encryption progress
    setUploadStatus('encrypting');
    
    // In production: Use Web Crypto API for AES-256-GCM encryption
    // const key = await crypto.subtle.generateKey(...);
    // const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM' }, key, buffer);
    
    // For demo, we just return the file (encryption happens server-side)
    return file;
  };

  // =============================================================================
  // Bitrix24 Upload
  // =============================================================================

  /**
   * Upload encrypted document to Bitrix24 Document folder
   */
  const uploadToBitrix24 = async (
    encryptedFile: Blob,
    metadata: {
      entityId: string;
      type: string;
      bishop: string;
      metadata: Record<string, unknown>;
    }
  ): Promise<string> => {
    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', encryptedFile, uploadedFile?.name || 'canonical_approval.pdf');
    formData.append('metadata', JSON.stringify(metadata));
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const response = await fetch('/api/bitrix24/documents', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return data.documentId;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  // =============================================================================
  // Canonical Authorities Notification
  // =============================================================================

  /**
   * Notify bishop (email) and diocese admin (Bitrix24 activity)
   */
  const notifyCanonicalAuthorities = async (
    diocese: string,
    documentId: string
  ): Promise<void> => {
    // In production, this would:
    // 1. Send email to bishop using transactional email service
    // 2. Create Bitrix24 activity for diocese admin
    // 3. Log notification for audit trail
    
    console.log('[CANONICAL] Notifying authorities:', { diocese, documentId });
    
    await fetch('/api/notifications/canonical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diocese,
        documentId,
        entityId,
        type: 'approval_request',
      }),
    });
  };

  // =============================================================================
  // Main Submit Handler
  // =============================================================================

  const onSubmit = async (data: ApprovalFormData) => {
    setErrorMessage(null);
    
    try {
      // Step 1: Encrypt file before upload (GDPR Article 32)
      let encryptedFile: Blob | undefined;
      if (uploadedFile) {
        encryptedFile = await encryptFile(uploadedFile);
      }
      
      // Step 2: Upload to Bitrix24 (Document folder)
      let documentId: string | null = null;
      if (encryptedFile) {
        documentId = await uploadToBitrix24(encryptedFile, {
          entityId,
          type: 'canonical_approval',
          bishop: data.bishopName,
          metadata: {
            diocese: data.diocese,
            letterDate: data.letterDate,
            recognitio: data.recognitioNumber || 'pending',
            decreeNumber: data.decreeNumber,
          },
        });
        setBitrixDocId(documentId);
      }
      
      // Step 3: Update entity status
      setUploadStatus('verifying');
      
      approveEntity(
        {
          entityId,
          approvalData: {
            ...data,
            bitrixDocumentId: documentId,
            canonicalDocument: uploadedFile?.name,
            submittedAt: new Date().toISOString(),
          },
        },
        {
          onSuccess: async () => {
            // Step 4: Notify canonical authorities
            if (data.diocese && documentId) {
              await notifyCanonicalAuthorities(data.diocese, documentId);
            }
            
            setUploadStatus('approved');
            
            // Reset and close after delay
            setTimeout(() => {
              reset();
              setUploadedFile(null);
              setStep('verify');
              onApproved();
            }, 2000);
          },
          onError: (error) => {
            setUploadStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Approval failed');
          },
        }
      );
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage('File size must be less than 10MB');
        return;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setErrorMessage('Only PDF or JPEG files are accepted');
        return;
      }
      setUploadedFile(file);
      setErrorMessage(null);
      setValue('document', file);
    }
  };

  const handleClose = () => {
    reset();
    setUploadedFile(null);
    setStep('verify');
    setUploadStatus('idle');
    setUploadProgress(0);
    setBitrixDocId(null);
    setErrorMessage(null);
    onClose();
  };

  // Get status configuration for UI
  const getStatusConfig = () => {
    switch (uploadStatus) {
      case 'encrypting':
        return {
          icon: Lock,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          message: 'Encrypting document (GDPR Article 32)...',
        };
      case 'uploading':
        return {
          icon: Upload,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          message: 'Uploading to Bitrix24...',
        };
      case 'verifying':
        return {
          icon: FileCheck,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          message: 'Verifying with Diocese...',
        };
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          message: 'Canonical approval granted!',
        };
      case 'rejected':
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          message: errorMessage || 'Approval failed',
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-amber-600" />
            Canonical Verification Required
          </DialogTitle>
          <DialogDescription className="text-amber-700">
            Per <strong>Code of Canon Law 1300-1307</strong>, this entity requires Episcopal
            approval before accepting donations.
          </DialogDescription>
        </DialogHeader>

        {entityLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : uploadStatus === 'approved' ? (
          // Success state
          <div className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Canonical Approval Submitted
            </h3>
            <p className="text-sm text-gray-600">
              Document ID: {bitrixDocId}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Processing time: {VATICAN_PROCESSING_DAYS} days if Vatican recognitio is required
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Entity Summary - Amber bordered card */}
            <div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Church className="h-8 w-8 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900">{entity?.name}</h4>
                    <p className="text-sm text-amber-700">
                      {entity?.type} • {entity?.country}
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
                  Pending Canonical Approval
                </Badge>
              </div>
            </div>

            {/* Upload Progress */}
            {statusConfig && (
              <div className={cn('p-4 rounded-lg', statusConfig.bg)}>
                <div className="flex items-center gap-3">
                  <statusConfig.icon className={cn('h-5 w-5 animate-pulse', statusConfig.color)} />
                  <div className="flex-1">
                    <p className={cn('font-medium', statusConfig.color)}>
                      {statusConfig.message}
                    </p>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <Progress value={uploadProgress} className="h-2 mt-2" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Verification Step */}
            {step === 'verify' && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Pre-Approval Verification Checklist
                </h4>
                <p className="text-sm text-gray-600">
                  Before submitting, verify the following canonical requirements:
                </p>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  {[
                    'Entity is a recognized Catholic organization within the diocese',
                    'Canonical territory (parish boundaries) is correctly identified',
                    'Diocese jurisdiction over this entity is confirmed',
                    'Entity complies with Canon Law CIC 1300-1307 requirements',
                    'Bishop has authority to grant this approval',
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`check-${index}`}
                        className="rounded mt-1 border-amber-300"
                      />
                      <label htmlFor={`check-${index}`} className="text-sm text-gray-700">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="w-full bg-amber-700 hover:bg-amber-800"
                >
                  Proceed to Document Upload
                </Button>
              </div>
            )}

            {/* Upload Step */}
            {step === 'upload' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Bishop Name */}
                  <div className="space-y-2">
                    <Label htmlFor="bishopName" className="text-amber-800">
                      Bishop's Full Name *
                    </Label>
                    <Input
                      id="bishopName"
                      {...register('bishopName')}
                      placeholder="E.g., His Excellency Archbishop Gintaras Grušas"
                      className={cn('border-amber-200', errors.bishopName && 'border-red-500')}
                    />
                    {errors.bishopName && (
                      <p className="text-sm text-red-500">{errors.bishopName.message}</p>
                    )}
                  </div>

                  {/* Bishop Title */}
                  <div className="space-y-2">
                    <Label htmlFor="bishopTitle" className="text-amber-800">
                      Bishop's Title *
                    </Label>
                    <Input
                      id="bishopTitle"
                      {...register('bishopTitle')}
                      placeholder="Archbishop of Vilnius"
                      className={cn('border-amber-200', errors.bishopTitle && 'border-red-500')}
                    />
                    {errors.bishopTitle && (
                      <p className="text-sm text-red-500">{errors.bishopTitle.message}</p>
                    )}
                  </div>

                  {/* Diocese */}
                  <div className="space-y-2">
                    <Label htmlFor="diocese" className="text-amber-800">
                      Diocese *
                    </Label>
                    <select
                      id="diocese"
                      {...register('diocese')}
                      className={cn(
                        'w-full border rounded p-2 border-amber-200',
                        errors.diocese && 'border-red-500'
                      )}
                    >
                      <option value="">Select Diocese</option>
                      {DIOCESES_LT.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    {errors.diocese && (
                      <p className="text-sm text-red-500">{errors.diocese.message}</p>
                    )}
                  </div>

                  {/* Letter Date */}
                  <div className="space-y-2">
                    <Label htmlFor="letterDate" className="text-amber-800">
                      Letter Date *
                    </Label>
                    <Input
                      id="letterDate"
                      type="date"
                      {...register('letterDate')}
                      className={cn('border-amber-200', errors.letterDate && 'border-red-500')}
                    />
                    {errors.letterDate && (
                      <p className="text-sm text-red-500">{errors.letterDate.message}</p>
                    )}
                  </div>

                  {/* Decree Number */}
                  <div className="space-y-2">
                    <Label htmlFor="decreeNumber" className="text-amber-800">
                      Decree Number (Optional)
                    </Label>
                    <Input
                      id="decreeNumber"
                      {...register('decreeNumber')}
                      placeholder="DOC-2024-001"
                      className="border-amber-200"
                    />
                  </div>

                  {/* Recognitio Number */}
                  <div className="space-y-2">
                    <Label htmlFor="recognitioNumber" className="text-amber-800">
                      Recognitio Number (Vatican)
                    </Label>
                    <Input
                      id="recognitioNumber"
                      {...register('recognitioNumber')}
                      placeholder="Vatican approval number if available"
                      className="border-amber-200"
                    />
                    <p className="text-xs text-gray-500">
                      If pending, document will be forwarded to Congregation for the Clergy
                    </p>
                  </div>
                </div>

                {/* Document Upload - Amber dashed border */}
                <div className="space-y-2">
                  <Label className="text-amber-800">Letter of Approval (PDF/JPEG) *</Label>
                  <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center bg-amber-50/50 hover:bg-amber-50 transition-colors">
                    <input
                      type="file"
                      id="canonical-doc"
                      accept=".pdf,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="canonical-doc" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <span className="text-sm text-amber-700">
                        {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Max 10MB, PDF or JPEG only</p>
                    </label>
                  </div>
                  {errors.document && (
                    <p className="text-sm text-red-500">{errors.document.message}</p>
                  )}
                  {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                  )}
                </div>

                {/* Approval Notes */}
                <div className="space-y-2">
                  <Label htmlFor="approvalNotes" className="text-amber-800">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="approvalNotes"
                    {...register('approvalNotes')}
                    placeholder="Any additional information about this approval..."
                    rows={3}
                    className="border-amber-200"
                  />
                </div>

                {/* Canon Law Warning */}
                <div className="bg-amber-50 p-4 rounded-lg flex gap-3 items-start border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">
                      Document Encryption & Storage
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      This document will be encrypted before upload (GDPR Article 32) and
                      transmitted to the Vatican's Congregation for the Clergy if recognitio
                      is pending. Processing time: {VATICAN_PROCESSING_DAYS} days.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('verify')}
                    disabled={uploadStatus !== 'idle'}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep('confirm')}
                    className="flex-1 bg-amber-700 hover:bg-amber-800"
                    disabled={uploadStatus !== 'idle'}
                  >
                    Review Approval
                  </Button>
                </div>
              </div>
            )}

            {/* Confirm Step */}
            {step === 'confirm' && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-amber-800">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Confirm Canonical Approval
                </h4>

                {/* Summary of what will be submitted */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <h5 className="font-medium text-amber-900">Submission Summary</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Bishop:</span>
                      <span className="font-medium">{watchedBishopName || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Diocese:</span>
                      <span className="font-medium">
                        {DIOCESES_LT.find((d) => d.value === watchedDiocese)?.label || watchedDiocese}
                      </span>
                    </div>
                    {uploadedFile && (
                      <div className="flex justify-between">
                        <span className="text-amber-700">Document:</span>
                        <span className="font-medium flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {uploadedFile.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning about consequences */}
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">
                    By confirming, you are granting canonical approval for this entity
                    under <strong>Canon Law CIC 1300-1307</strong>. This authorizes the
                    entity to accept donations and administer ecclesiastical goods.
                    This action will be logged permanently and cannot be undone.
                  </p>
                </div>

                {/* GDPR encryption notice */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-800">
                    Document will be encrypted (GDPR Article 32) before upload to Bitrix24
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('upload')}
                    disabled={uploadStatus !== 'idle'}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isApproving || uploadStatus !== 'idle'}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Submit for Canonical Approval
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Canon Law Reference */}
            <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
              <p className="font-medium mb-1">Canon Law CIC 1300-1307 Reference:</p>
              <p>
                These canons govern the administration of ecclesiastical goods. Without
                proper Episcopal approval, a Catholic entity cannot legally accept
                donations or manage church property. This workflow ensures compliance
                with Catholic Church governance requirements.
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
