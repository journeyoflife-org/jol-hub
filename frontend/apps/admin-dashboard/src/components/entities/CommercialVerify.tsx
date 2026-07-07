'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Store,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useEntity, useVerifyEntity } from '@/lib/hooks';

// =============================================================================
// Commercial Verification Schema
// VAT and business license verification
// =============================================================================

const verificationSchema = z.object({
  vatNumber: z.string().min(5, 'VAT number is required'),
  registrationNumber: z.string().optional(),
  companyName: z.string().min(2, 'Company name is required'),
  country: z.string().min(2, 'Country is required'),
  website: z.string().url().optional().or(z.literal('')),
  verificationNotes: z.string().optional(),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

// =============================================================================
// Commercial Verify Component
// VAT/license verification for commercial entities
// SOC2 CC6.1: Business verification for compliance
// =============================================================================

interface CommercialVerifyProps {
  entityId: string;
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}


export function CommercialVerify({
  entityId,
  open,
  onClose,
  onVerified,
}: CommercialVerifyProps) {
  const [isVerifyingVAT, setIsVerifyingVAT] = useState(false);
  const [vatValid, setVatValid] = useState<boolean | null>(null);

  const { data: entity, isLoading: entityLoading } = useEntity(entityId);
  const { mutate: verifyEntity, isPending: isVerifying } = useVerifyEntity();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      vatNumber: entity?.vatNumber ?? '',
      registrationNumber: '',
      companyName: entity?.name ?? '',
      country: entity?.country ?? '',
      website: entity?.website ?? '',
      verificationNotes: '',
    },
  });

  const vatNumber = watch('vatNumber');
  const country = watch('country');

  const verifyVAT = async () => {
    if (!vatNumber || !country) return;

    setIsVerifyingVAT(true);
    try {
      // Call backend VAT validation endpoint
      const response = await fetch('/api/vat/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatNumber, country }),
      });

      const result = await response.json();
      setVatValid(result.valid);
    } catch (error) {
      console.error('VAT validation error:', error);
      setVatValid(false);
    } finally {
      setIsVerifyingVAT(false);
    }
  };

  const onSubmit = (data: VerificationFormData) => {
    verifyEntity(
      {
        entityId,
        verificationData: data,
      },
      {
        onSuccess: () => {
          reset();
          setVatValid(null);
          onVerified();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    setVatValid(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-500" />
            Commercial Verification
          </DialogTitle>
          <DialogDescription>
            VAT and business license verification for commercial entities
          </DialogDescription>
        </DialogHeader>

        {entityLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Entity Summary */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{entity?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {entity?.type} • {entity?.country}
                  </p>
                </div>
                <Badge variant="outline" className="border-blue-500 text-blue-600">
                  Unverified
                </Badge>
              </div>
            </div>

            {/* Verification Form */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    {...register('companyName')}
                    className={errors.companyName ? 'border-red-500' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">{errors.companyName.message}</p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    className={errors.country ? 'border-red-500' : ''}
                  />
                  {errors.country && (
                    <p className="text-sm text-red-500">{errors.country.message}</p>
                  )}
                </div>
              </div>

              {/* VAT Number */}
              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number *</Label>
                <div className="flex gap-2">
                  <Input
                    id="vatNumber"
                    {...register('vatNumber')}
                    placeholder="LT123456789"
                    className={errors.vatNumber ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={verifyVAT}
                    disabled={isVerifyingVAT || !vatNumber}
                  >
                    {isVerifyingVAT ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                {errors.vatNumber && (
                  <p className="text-sm text-red-500">{errors.vatNumber.message}</p>
                )}
                {vatValid === true && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    VAT number is valid
                  </p>
                )}
                {vatValid === false && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    VAT number is invalid
                  </p>
                )}
              </div>

              {/* Registration Number */}
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Business Registration Number</Label>
                <Input
                  id="registrationNumber"
                  {...register('registrationNumber')}
                  placeholder="Optional business registration number"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...register('website')}
                  placeholder="https://company.example.com"
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && (
                  <p className="text-sm text-red-500">{errors.website.message}</p>
                )}
              </div>

              {/* Verification Notes */}
              <div className="space-y-2">
                <Label htmlFor="verificationNotes">Verification Notes</Label>
                <textarea
                  id="verificationNotes"
                  {...register('verificationNotes')}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Additional notes about this verification..."
                />
              </div>
            </div>

            {/* External Links */}
            <div className="flex items-center gap-4 text-sm">
              <a
                href="https://ec.europa.eu/taxation_customs/vies/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                VIES VAT Validation
              </a>
            </div>

            <Separator />

            {/* Form Actions */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isVerifying || vatValid === false}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Business
                  </>
                )}
              </Button>
            </DialogFooter>

            {/* Compliance Notice */}
            <div className="text-xs text-muted-foreground">
              <p>
                <strong>SOC2 CC6.1:</strong> Business verification ensures compliance
                with financial regulations and prevents fraudulent registrations.
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
