/**
 * ContactForm Component
 * Validates phone/email and sends to Bitrix24 CRM
 * WCAG 2.1 AA accessible
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { Alert, AlertDescription } from './alert';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface ContactFormProps {
  parishId: string;
  recipientType: 'priest' | 'funeral_director' | 'cemetery_admin' | 'general';
  recipientEmail?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface BitrixCrmContactPayload {
  fields: {
    NAME: string;
    EMAIL: Array<{ VALUE: string; VALUE_TYPE: 'WORK' | 'HOME' }>;
    PHONE: Array<{ VALUE: string; VALUE_TYPE: 'WORK' | 'MOBILE' }>;
    COMMENTS: string;
    SOURCE_ID: string;
    UF_CRM_PARISH_ID: string;
  };
  params: {
    REGISTER_SONET_EVENT: 'Y';
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional
  return PHONE_REGEX.test(phone.replace(/\s/g, ''));
}

// =============================================================================
// BITRIX24 CRM INTEGRATION
// =============================================================================

async function sendToBitrixCRM(
  data: ContactFormData,
  parishId: string,
  recipientType: string
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.NEXT_PUBLIC_BITRIX_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error('[CONTACT FORM] Bitrix webhook URL not configured');
    return { success: false, error: 'CRM integration not configured' };
  }

  const payload: BitrixCrmContactPayload = {
    fields: {
      NAME: data.name,
      EMAIL: [{ VALUE: data.email, VALUE_TYPE: 'WORK' }],
      PHONE: data.phone ? [{ VALUE: data.phone, VALUE_TYPE: 'MOBILE' }] : [],
      COMMENTS: `Subject: ${data.subject}

Message: ${data.message}

Recipient Type: ${recipientType}`,
      SOURCE_ID: 'WEB_FORM',
      UF_CRM_PARISH_ID: parishId,
    },
    params: {
      REGISTER_SONET_EVENT: 'Y',
    },
  };

  try {
    const response = await fetch(`${webhookUrl}crm.contact.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error_description || result.error);
    }

    return { success: true };
  } catch (error) {
    console.error('[CONTACT FORM] Bitrix CRM error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send to CRM' 
    };
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ContactForm({
  parishId,
  recipientType,
  onSuccess,
  onError,
  className = '',
}: ContactFormProps): JSX.Element {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};

    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Please enter your full name (at least 2 characters)';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.subject.trim() || formData.subject.length < 3) {
      newErrors.subject = 'Please enter a subject (at least 3 characters)';
    }

    if (!formData.message.trim() || formData.message.length < 10) {
      newErrors.message = 'Please enter a message (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback(
    (field: keyof ContactFormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await sendToBitrixCRM(formData, parishId, recipientType);

        if (result.success) {
          setIsSuccess(true);
          onSuccess?.();
        } else {
          setSubmitError(result.error || 'Failed to send message');
          onError?.(result.error || 'Failed to send message');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setSubmitError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, parishId, recipientType, validateForm, onSuccess, onError]
  );

  const handleReset = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
    setErrors({});
    setIsSuccess(false);
    setSubmitError(null);
  }, []);

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold">Message Sent Successfully</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for contacting us. We will get back to you soon.
              </p>
            </div>
            <Button onClick={handleReset} variant="outline">
              Send Another Message
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
        <CardDescription>
          Send us a message and we will respond as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="contact-name">
              Full Name <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Input
              id="contact-name"
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="John Smith"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-500" role="alert">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="contact-email">
              Email Address <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="john@example.com"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-500" role="alert">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone Number (optional)</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              placeholder="+370 600 00000"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p id="phone-error" className="text-sm text-red-500" role="alert">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="contact-subject">
              Subject <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Input
              id="contact-subject"
              type="text"
              value={formData.subject}
              onChange={handleChange('subject')}
              placeholder="How can we help you?"
              aria-required="true"
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? 'subject-error' : undefined}
              disabled={isSubmitting}
            />
            {errors.subject && (
              <p id="subject-error" className="text-sm text-red-500" role="alert">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.subject}
              </p>
            )}
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="contact-message">
              Message <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Textarea
              id="contact-message"
              value={formData.message}
              onChange={handleChange('message')}
              placeholder="Please describe your inquiry in detail..."
              rows={5}
              aria-required="true"
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'message-error' : undefined}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p id="message-error" className="text-sm text-red-500" role="alert">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {errors.message}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
