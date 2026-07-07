'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, Select } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export type SacramentType = 'baptism' | 'marriage' | 'first_communion' | 'confirmation' | 'death';

export interface SacramentalRecordsRequest {
  sacramentType: SacramentType;
  personName: string;
  dateOfSacrament?: string;
  parentsNames?: string;
  spouseName?: string;
  godparents?: string;
  celebrant?: string;
  requestReason: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
}

export interface SacramentalRecordsFormProps {
  onSubmit?: (request: SacramentalRecordsRequest) => Promise<void>;
  className?: string;
}

const sacramentTypes = [
  { value: 'baptism', labelLt: 'Krikštas', labelEn: 'Baptism' },
  { value: 'marriage', labelLt: 'Santuoka', labelEn: 'Marriage' },
  { value: 'first_communion', labelLt: 'Pirmoji komunija', labelEn: 'First Communion' },
  { value: 'confirmation', labelLt: 'Sutvirtinimas', labelEn: 'Confirmation' },
  { value: 'death', labelLt: 'Mirties įrašas', labelEn: 'Death Record' },
];

const requestReasons = [
  { value: 'personal', labelLt: 'Asmeninis poreikis', labelEn: 'Personal need' },
  { value: 'legal', labelLt: 'Teisiniai tikslai', labelEn: 'Legal purposes' },
  { value: 'genealogy', labelLt: 'Genealogija', labelEn: 'Genealogy' },
  { value: 'church', labelLt: 'Bažnytiniai tikslai', labelEn: 'Church purposes' },
];

export function SacramentalRecordsForm({
  onSubmit,
  className,
}: SacramentalRecordsFormProps) {
  const [formData, setFormData] = useState<Partial<SacramentalRecordsRequest>>({
    sacramentType: 'baptism',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData as SacramentalRecordsRequest);
    } catch (error) {
      console.error('Failed to submit records request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn('max-w-lg', className)}>
      <CardHeader>
        <CardTitle className="text-xl font-heading">
          Sakramentų dokumentų užklausa
        </CardTitle>
        <p className="text-sm text-gray-600">Sacramental Records Request</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sacrament Type */}
          <div className="space-y-2">
            <Label>Sakramento tipas / Sacrament Type</Label>
            <Select
              value={formData.sacramentType}
              onValueChange={(value) => setFormData({ ...formData, sacramentType: value as SacramentType })}
            >
              {sacramentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.labelLt} / {type.labelEn}
                </option>
              ))}
            </Select>
          </div>

          {/* Person Name */}
          <div className="space-y-2">
            <Label htmlFor="personName">Asmuo / Person *</Label>
            <Input
              id="personName"
              value={formData.personName || ''}
              onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
              placeholder="Vardenis Pavardenis"
              required
            />
          </div>

          {/* Date of Sacrament */}
          <div className="space-y-2">
            <Label htmlFor="dateOfSacrament">Data (jei žinoma) / Date (if known)</Label>
            <Input
              id="dateOfSacrament"
              type="date"
              value={formData.dateOfSacrament || ''}
              onChange={(e) => setFormData({ ...formData, dateOfSacrament: e.target.value })}
            />
          </div>

          {/* Requester Info */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requesterName">Jūsų vardas / Your Name *</Label>
              <Input
                id="requesterName"
                value={formData.requesterName || ''}
                onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requesterEmail">El. paštas / Email *</Label>
              <Input
                id="requesterEmail"
                type="email"
                value={formData.requesterEmail || ''}
                onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requesterPhone">Telefonas / Phone</Label>
              <Input
                id="requesterPhone"
                type="tel"
                value={formData.requesterPhone || ''}
                onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
              />
            </div>
          </div>

          {/* Request Reason */}
          <div className="space-y-2">
            <Label>Užklausos priežastis / Request Reason</Label>
            <Select
              value={formData.requestReason}
              onValueChange={(value) => setFormData({ ...formData, requestReason: value })}
            >
              {requestReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.labelLt} / {reason.labelEn}
                </option>
              ))}
            </Select>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Siunčiama... / Submitting...' : 'Pateikti užklausą / Submit Request'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Dokumentai bus parengti per 3-5 darbo dienas.
            <br />
            Documents will be prepared within 3-5 business days.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default SacramentalRecordsForm;
