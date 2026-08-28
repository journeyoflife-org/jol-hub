/**
 * BookingWidget — STEP 8 (booking).
 *
 * Service selection → date/time slot → staff → Zod-validated customer info
 * with GDPR consent → review/summary → confirmation with a reference number
 * and optional iCal/ICS download.
 *
 * AVAILABILITY comes from the backend (`getProducts`/booking endpoints); slots
 * marked unavailable are blocked. The booking is tagged with the tenant slug
 * (GDPR Art. 9 RLS isolation).
 *
 * PCI-DSS (SAQ A): booking is lead-gen by default — any deposit/payment is
 * confirmed via Stripe-hosted surfaces, never here.
 *
 * PILOT (ADR-007): with no commerce backend / service catalogue configured the
 * widget shows a "booking being prepared" notice instead of fabricating slots.
 * Gated by the `booking` capability.
 */
'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { createBooking, isCommerceConfigured, type BookingSlot } from '@jol-hub/commerce';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { Button } from '@jol-hub/ui/components/primitives';
import { useTenant, useTenantFeature } from '@/lib/tenant-context';

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  consent: z.boolean().refine((value) => value === true),
});
type CustomerDraft = z.input<typeof customerSchema>;

export interface BookingService {
  id: string;
  name: string;
}

export interface BookingStaff {
  id: string;
  name: string;
}

export interface BookingWidgetProps {
  locale?: string;
  /** Server-fetched service catalogue (empty = pilot, show pending notice). */
  services?: BookingService[];
  /** Server-fetched available slots. */
  slots?: BookingSlot[];
  staff?: BookingStaff[];
}

type Step = 'select' | 'details' | 'review' | 'done';

export function BookingWidget({ locale = 'lt', services = [], slots = [], staff = [] }: BookingWidgetProps) {
  const t = useTranslations('commerce');
  const tenant = useTenant();
  const entitled = useTenantFeature('booking');

  const [step, setStep] = useState<Step>('select');
  const [serviceId, setServiceId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [draft, setDraft] = useState<CustomerDraft>({ name: '', email: '', phone: '', notes: '', consent: false });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});
  const [reference, setReference] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableSlots = useMemo(() => slots.filter((slot) => slot.available), [slots]);
  const selectedSlot = availableSlots.find((slot) => slot.id === slotId);

  // Hide entirely when the tenant's package does not include booking.
  if (!entitled) return null;

  // Pilot: no catalogue/availability configured — never fabricate slots.
  if (!isCommerceConfigured() || services.length === 0) {
    return (
      <section
        aria-label={t('bookingTitle')}
        className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 className="mb-2 font-heading text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {t('bookingTitle')}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('bookingUnavailable')}</p>
      </section>
    );
  }

  const validateDetails = (): boolean => {
    const parsed = customerSchema.safeParse(draft);
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const next: Partial<Record<keyof CustomerDraft, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CustomerDraft | undefined;
      if (key && !next[key]) next[key] = t('requiredField');
    }
    setErrors(next);
    return false;
  };

  const handleConfirm = async () => {
    if (!serviceId || !slotId) return;
    setSubmitting(true);
    const result = await createBooking(tenant.slug, {
      tenantSlug: tenant.slug,
      serviceId,
      slotId,
      customer: {
        name: draft.name ?? '',
        email: draft.email ?? '',
        phone: draft.phone,
        notes: draft.notes,
      },
      consent: draft.consent === true,
    });
    setSubmitting(false);
    if (result.ok) {
      setReference(result.data.reference);
      setStep('done');
    }
  };

  const labelClass = 'mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200';
  const inputClass =
    'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900';

  return (
    <section
      aria-label={t('bookingTitle')}
      className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-4 font-heading text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        {t('bookingTitle')}
      </h2>

      {step === 'select' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="booking-service" className={labelClass}>
              {t('selectService')}
            </label>
            <select
              id="booking-service"
              className={inputClass}
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
            >
              <option value="">—</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="booking-slot" className={labelClass}>
              {t('selectSlot')}
            </label>
            <select
              id="booking-slot"
              className={inputClass}
              value={slotId}
              onChange={(event) => setSlotId(event.target.value)}
              disabled={availableSlots.length === 0}
            >
              <option value="">—</option>
              {availableSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {new Date(slot.startDateTime).toLocaleString(locale)}
                </option>
              ))}
            </select>
          </div>

          {staff.length > 0 ? (
            <div>
              <label htmlFor="booking-staff" className={labelClass}>
                {t('selectStaff')}
              </label>
              <select
                id="booking-staff"
                className={inputClass}
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
              >
                <option value="">—</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Button
            className="w-full"
            disabled={!serviceId || !slotId}
            onClick={() => setStep('details')}
          >
            {t('next')}
          </Button>
        </div>
      ) : null}

      {step === 'details' ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="booking-name" className={labelClass}>
              {t('nameLabel')} *
            </label>
            <input
              id="booking-name"
              className={inputClass}
              value={draft.name ?? ''}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="booking-email" className={labelClass}>
              {t('emailLabel')} *
            </label>
            <input
              id="booking-email"
              type="email"
              className={inputClass}
              value={draft.email ?? ''}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="booking-phone" className={labelClass}>
              {t('phoneLabel')}
            </label>
            <input
              id="booking-phone"
              type="tel"
              className={inputClass}
              value={draft.phone ?? ''}
              onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
            />
          </div>

          <div>
            <label htmlFor="booking-notes" className={labelClass}>
              {t('notesLabel')}
            </label>
            <textarea
              id="booking-notes"
              className={inputClass}
              rows={3}
              value={draft.notes ?? ''}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-200">
            <input
              type="checkbox"
              checked={draft.consent === true}
              onChange={(event) => setDraft({ ...draft, consent: event.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-neutral-700"
            />
            <span>{t('consentBooking')}</span>
          </label>
          {errors.consent ? <p className="text-xs text-red-600">{errors.consent}</p> : null}

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('select')}>
              {t('back')}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (validateDetails()) setStep('review');
              }}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'review' ? (
        <div className="space-y-4">
          <dl className="space-y-1 rounded-md border border-neutral-200 p-4 text-sm dark:border-neutral-700">
            <div className="flex justify-between">
              <dt className="text-neutral-500 dark:text-neutral-400">{t('selectService')}</dt>
              <dd>{services.find((service) => service.id === serviceId)?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500 dark:text-neutral-400">{t('selectSlot')}</dt>
              <dd>{selectedSlot ? new Date(selectedSlot.startDateTime).toLocaleString(locale) : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500 dark:text-neutral-400">{t('nameLabel')}</dt>
              <dd>{draft.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500 dark:text-neutral-400">{t('emailLabel')}</dt>
              <dd>{draft.email}</dd>
            </div>
          </dl>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('details')}>
              {t('back')}
            </Button>
            <Button className="flex-1" loading={submitting} onClick={handleConfirm}>
              {t('confirmBooking')}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-neutral-700 dark:text-neutral-200">{t('bookingSuccess')}</p>
          {reference ? (
            <p className="font-mono text-lg font-semibold text-neutral-900 dark:text-neutral-50">{reference}</p>
          ) : null}
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('addToCalendar')}</p>
        </div>
      ) : null}
    </section>
  );
}
