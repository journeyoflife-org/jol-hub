/**
 * DonationDetailsForm — amount/frequency/purpose/donor/consent sections of
 * the DonationWidget, extracted for the STEP 3 250-line rule. Markup is
 * unchanged from the original widget.
 */

'use client';

import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { Checkbox } from '../checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Separator } from '../separator';
import { SpinnerIcon } from './donation-icons';

export const DONATION_PURPOSES = [
  { value: 'general', label: 'General donation' },
  { value: 'renovation', label: 'Church renovation' },
  { value: 'charity', label: 'Charity' },
  { value: 'liturgical', label: 'Liturgical supplies' },
];

export interface DonationDetailsFormProps {
  defaultAmounts: number[];
  amount: number | null;
  customAmount: string;
  frequency: 'one-time' | 'monthly';
  purpose: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  isLoading: boolean;
  finalAmount: number;
  parishName: string;
  privacyPolicyUrl: string;
  formatAmount: (value: number) => string;
  onAmountSelect: (value: number) => void;
  onCustomAmountChange: (value: string) => void;
  onFrequencyChange: (frequency: 'one-time' | 'monthly') => void;
  onPurposeChange: (purpose: string) => void;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onConsentChange: (consent: boolean) => void;
  onSubmit: () => void;
}

export function DonationDetailsForm({
  defaultAmounts,
  amount,
  customAmount,
  frequency,
  purpose,
  name,
  email,
  phone,
  consent,
  isLoading,
  finalAmount,
  parishName,
  privacyPolicyUrl,
  formatAmount,
  onAmountSelect,
  onCustomAmountChange,
  onFrequencyChange,
  onPurposeChange,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onConsentChange,
  onSubmit,
}: DonationDetailsFormProps): JSX.Element {
  return (
    <>
      {/* Amount Selection */}
      <div className="space-y-3">
        <Label>Select Amount</Label>
        <div className="grid grid-cols-3 gap-2">
          {defaultAmounts.map((value) => (
            <Button
              key={value}
              type="button"
              variant={amount === value ? 'default' : 'outline'}
              onClick={() => onAmountSelect(value)}
              className={amount === value ? 'bg-[#00843D] hover:bg-[#006b32]' : ''}
            >
              {formatAmount(value)}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Input
            type="text"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => onCustomAmountChange(e.target.value)}
            className="pl-8"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            €
          </span>
        </div>
      </div>

      {/* Frequency Toggle */}
      <div className="space-y-3">
        <Label>Frequency</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={frequency === 'one-time' ? 'default' : 'outline'}
            onClick={() => onFrequencyChange('one-time')}
            className={`flex-1 ${frequency === 'one-time' ? 'bg-[#00843D] hover:bg-[#006b32]' : ''}`}
          >
            One-time
          </Button>
          <Button
            type="button"
            variant={frequency === 'monthly' ? 'default' : 'outline'}
            onClick={() => onFrequencyChange('monthly')}
            className={`flex-1 ${frequency === 'monthly' ? 'bg-[#00843D] hover:bg-[#006b32]' : ''}`}
          >
            Monthly
          </Button>
        </div>
      </div>

      {/* Purpose Selection */}
      <div className="space-y-3">
        <Label>Purpose</Label>
        <Select value={purpose} onValueChange={onPurposeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select purpose" />
          </SelectTrigger>
          <SelectContent>
            {DONATION_PURPOSES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Donor Information */}
      <div className="space-y-3">
        <Label>Your Information</Label>
        <Input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <Input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
      </div>

      {/* GDPR Consent */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(checked) => onConsentChange(checked as boolean)}
          />
          <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer">
            I consent to processing personal data for donation purposes and tax receipt 
            issuance (GDPR Article 6(1)(a)). I understand my data will be shared with{' '}
            {parishName} and payment processor.{' '}
            <a 
              href={privacyPolicyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#00843D] hover:underline"
            >
              Privacy Policy
            </a>
          </label>
        </div>
      </div>

      <Separator />

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={isLoading || !consent || finalAmount < 1}
        className="w-full"
        style={{ backgroundColor: '#00843D' }}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <SpinnerIcon />
            Processing...
          </span>
        ) : (
          `Donate ${finalAmount > 0 ? formatAmount(finalAmount) : ''}`
        )}
      </Button>
    </>
  );
}
