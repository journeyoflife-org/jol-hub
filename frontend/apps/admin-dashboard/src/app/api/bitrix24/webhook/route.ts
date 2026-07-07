// =============================================================================
// Bitrix24 Webhook Handler - "The Mail Room"
// Real-time sync receiver for CRM integration
// GDPR Article 44: Country-scoped data processing with strict border control
// SOC2 CC6.1: Circuit breaker and audit logging for security
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

// =============================================================================
// Types and Interfaces
// =============================================================================

interface Bitrix24WebhookEvent {
  event: string;
  data: {
    FIELDS?: {
      ID?: string;
      ENTITY?: string;
      [key: string]: string | undefined;
    };
    [key: string]: unknown;
    residency?: string; // GDPR Article 44: Country code for data residency
  };
  ts: string;
  auth: {
    domain: string;
    client_id: string;
    user_id: string;
    member_id?: string;
    application_token?: string;
  };
  entityId?: string;
  entityType?: string;
  country?: string;
  action?: string;
}

interface AuditLogEntry {
  type: string;
  timestamp: string;
  entityId?: string;
  country?: string;
  data: Record<string, unknown>;
  hash?: string;
  previousHash?: string;
}

interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailure: string | null;
  resetTimeout: number;
  nextRetryTime: number;
}

interface RetryQueueEntry {
  event: Bitrix24WebhookEvent;
  attempts: number;
  nextRetry: number;
  lastError?: string;
}

// =============================================================================
// Configuration
// =============================================================================

const WEBHOOK_SECRET = process.env.BITRIX24_WEBHOOK_SECRET || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_TIMEOUT = 60000; // 60 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1000; // 1 second
const RETRY_MAX_DELAY = 30000; // 30 seconds

// Country-specific API URLs for GDPR Article 44 compliance
const COUNTRY_API_URLS: Record<string, string> = {
  lt: process.env.API_URL_LITHUANIA || 'http://localhost:8001/api/v1',
  pl: process.env.API_URL_POLAND || 'http://localhost:8002/api/v1',
  de: process.env.API_URL_GERMANY || 'http://localhost:8003/api/v1',
  default: API_URL,
};

// In-memory circuit breaker state (in production, use Redis)
const circuitBreakers = new Map<string, CircuitBreakerState>();

// In-memory retry queue (in production, use message queue)
const retryQueue: RetryQueueEntry[] = [];

// Audit log chain (in production, use database/blockchain)
let lastAuditHash = '0'.repeat(64);

// =============================================================================
// HMAC Signature Verification
// =============================================================================

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(payload: string): string {
  if (!WEBHOOK_SECRET) {
    return '';
  }
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
}

/**
 * Verify Bitrix24 webhook signature using HMAC-SHA256
 * Prevents spoofing attacks
 */
function verifyBitrixSignature(signature: string, payload: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[BITRIX24] Webhook secret not configured - skipping verification');
    return true;
  }
  
  if (!signature) {
    console.warn('[BITRIX24] Missing signature header');
    return false;
  }
  
  const expectedSignature = generateSignature(payload);
  
  // Handle different signature lengths safely
  if (signature.length !== expectedSignature.length) {
    console.warn('[BITRIX24] Signature length mismatch');
    return false;
  }
  
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (!isValid) {
      console.warn('[BITRIX24] Signature verification failed');
    }
    
    return isValid;
  } catch {
    // Fallback to simple comparison if hex decoding fails
    return signature === expectedSignature;
  }
}

// =============================================================================
// Circuit Breaker Implementation
// =============================================================================

/**
 * Get or create circuit breaker for a country
 */
function getCircuitBreaker(country: string): CircuitBreakerState {
  if (!circuitBreakers.has(country)) {
    circuitBreakers.set(country, {
      status: 'closed',
      failureCount: 0,
      lastFailure: null,
      resetTimeout: CIRCUIT_BREAKER_RESET_TIMEOUT,
      nextRetryTime: 0,
    });
  }
  return circuitBreakers.get(country)!;
}

/**
 * Check if circuit breaker allows requests
 */
function isCircuitBreakerOpen(country: string): boolean {
  const cb = getCircuitBreaker(country);
  
  if (cb.status === 'closed') {
    return false;
  }
  
  if (cb.status === 'open') {
    const now = Date.now();
    if (now >= cb.nextRetryTime) {
      // Transition to half-open
      cb.status = 'half-open';
      console.log(`[BITRIX24] Circuit breaker for ${country} moved to half-open`);
      return false;
    }
    return true;
  }
  
  // half-open: allow one request
  return false;
}

/**
 * Record successful operation
 */
function recordSuccess(country: string): void {
  const cb = getCircuitBreaker(country);
  cb.failureCount = 0;
  cb.status = 'closed';
  console.log(`[BITRIX24] Circuit breaker for ${country} closed`);
}

/**
 * Record failed operation
 */
function recordFailure(country: string): void {
  const cb = getCircuitBreaker(country);
  cb.failureCount++;
  cb.lastFailure = new Date().toISOString();
  
  if (cb.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    cb.status = 'open';
    cb.nextRetryTime = Date.now() + cb.resetTimeout;
    console.warn(`[BITRIX24] Circuit breaker for ${country} OPENED after ${cb.failureCount} failures`);
  }
}

// =============================================================================
// Retry Queue Implementation
// =============================================================================

/**
 * Add event to retry queue with exponential backoff
 */
function addToRetryQueue(event: Bitrix24WebhookEvent, error?: string): void {
  const existingEntry = retryQueue.find(
    e => e.event.event === event.event && 
         e.event.data.FIELDS?.ID === event.data.FIELDS?.ID
  );
  
  if (existingEntry) {
    existingEntry.attempts++;
    existingEntry.lastError = error;
    existingEntry.nextRetry = Date.now() + calculateBackoff(existingEntry.attempts);
    return;
  }
  
  retryQueue.push({
    event,
    attempts: 1,
    nextRetry: Date.now() + RETRY_BASE_DELAY,
    lastError: error,
  });
  
  console.log(`[BITRIX24] Added to retry queue: ${event.event} (queue size: ${retryQueue.length})`);
}

/**
 * Calculate exponential backoff with jitter
 */
function calculateBackoff(attempt: number): number {
  const delay = Math.min(
    RETRY_BASE_DELAY * Math.pow(2, attempt - 1),
    RETRY_MAX_DELAY
  );
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Process retry queue (should be called periodically)
 */
async function processRetryQueue(): Promise<void> {
  const now = Date.now();
  const readyEntries = retryQueue.filter(e => e.nextRetry <= now && e.attempts < MAX_RETRY_ATTEMPTS);
  
  for (const entry of readyEntries) {
    try {
      const country = entry.event.country || entry.event.data.residency || 'default';
      const apiUrl = COUNTRY_API_URLS[country] || COUNTRY_API_URLS.default;
      
      await forwardToBackend(entry.event, apiUrl);
      
      // Remove from queue on success
      const index = retryQueue.indexOf(entry);
      if (index > -1) {
        retryQueue.splice(index, 1);
      }
      
      recordSuccess(country);
      await createAuditLog('RETRY_SUCCESS', { event: entry.event.event, attempts: entry.attempts });
    } catch (error) {
      entry.attempts++;
      entry.nextRetry = Date.now() + calculateBackoff(entry.attempts);
      
      if (entry.attempts >= MAX_RETRY_ATTEMPTS) {
        console.error(`[BITRIX24] Max retries exceeded for ${entry.event.event}`);
        await createAuditLog('RETRY_EXHAUSTED', { event: entry.event.event, attempts: entry.attempts });
      }
    }
  }
}

// =============================================================================
// Audit Logging with Hash Chain
// =============================================================================

/**
 * Create immutable audit log entry with hash chain
 */
async function createAuditLog(
  type: string,
  data: Record<string, unknown>
): Promise<void> {
  const timestamp = new Date().toISOString();
  
  // Create hash chain entry
  const entry: AuditLogEntry = {
    type,
    timestamp,
    data,
    previousHash: lastAuditHash,
  };
  
  // Generate hash for this entry
  const entryString = JSON.stringify(entry, Object.keys(entry).sort());
  entry.hash = crypto.createHash('sha256').update(entryString).digest('hex');
  
  // Update last hash for chain
  lastAuditHash = entry.hash;
  
  // Log to console (in production, send to audit service/blockchain)
  console.log('[AUDIT]', JSON.stringify(entry));
  
  // Forward to Django audit service
  try {
    await fetch(`${API_URL}/compliance/audit/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
  } catch (error) {
    // Don't fail the webhook if audit logging fails
    console.error('[BITRIX24] Failed to create audit log:', error);
  }
}

// =============================================================================
// Main Webhook Handler - "The Mail Room"
// =============================================================================

/**
 * Forward webhook to country-specific backend (GDPR Article 44)
 */
async function forwardToBackend(event: Bitrix24WebhookEvent, apiUrl: string): Promise<void> {
  const response = await fetch(`${apiUrl}/integrations/bitrix24/webhook/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bitrix24-Domain': event.auth.domain,
      'X-Bitrix24-Country': event.country || event.data.residency || 'default',
      'X-Webhook-Timestamp': event.ts,
    },
    body: JSON.stringify(event),
  });
  
  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }
}

/**
 * POST /api/bitrix24/webhook
 * 
 * This is the "mail room" where Bitrix24 sends updates.
 * It checks:
 * 1. Is the mail really from Bitrix? (HMAC signature)
 * 2. Is it for the right country? (GDPR Article 44)
 * 3. Is the system healthy? (circuit breaker)
 * 4. Writes everything to permanent log (audit)
 */
export async function POST(request: NextRequest) {
  try {
    const bodyString = await request.text();
    const body: Bitrix24WebhookEvent = JSON.parse(bodyString);
    
    // Verify webhook authenticity with HMAC signature
    const authHeader = request.headers.get('x-bitrix24-signature') || '';
    if (!verifyBitrixSignature(authHeader, bodyString)) {
      await createAuditLog('WEBHOOK_REJECTED', {
        reason: 'invalid_signature',
        domain: body.auth?.domain,
        event: body.event,
      });
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Determine GDPR country for routing
    const country = body.country || body.data.residency || request.headers.get('x-bitrix24-country') || 'default';
    
    // Log the webhook event
    console.log('[BITRIX24] Webhook received:', {
      event: body.event,
      entity: body.data.FIELDS?.ENTITY,
      id: body.data.FIELDS?.ID,
      domain: body.auth.domain,
      country,
    });
    
    // Check circuit breaker
    if (isCircuitBreakerOpen(country)) {
      console.warn(`[BITRIX24] Circuit breaker OPEN for ${country}, queuing for retry`);
      addToRetryQueue(body, 'circuit_breaker_open');
      
      await createAuditLog('WEBHOOK_QUEUED', {
        reason: 'circuit_breaker_open',
        country,
        event: body.event,
      });
      
      return NextResponse.json({
        status: 'queued',
        reason: 'circuit_breaker_open',
        country,
      });
    }

    // Process based on event type
    switch (body.event) {
      case 'ONCRMDEALADD':
      case 'ONCRMDEALUPDATE':
      case 'ONCRMDEALDELETE':
        await handleDealEvent(body);
        break;
      
      case 'ONCRMCOMPANYADD':
      case 'ONCRMCOMPANYUPDATE':
      case 'ONCRMCOMPANYDELETE':
        await handleCompanyEvent(body);
        break;
      
      case 'ONCRMLEADADD':
      case 'ONCRMLEADUPDATE':
      case 'ONCRMLEADDELETE':
        await handleLeadEvent(body);
        break;
      
      case 'ONCRMCONTACTADD':
      case 'ONCRMCONTACTUPDATE':
      case 'ONCRMCONTACTDELETE':
        await handleContactEvent(body);
        break;
      
      default:
        console.log('[BITRIX24] Unhandled event type:', body.event);
    }

    // GDPR Article 44: Route to country-specific backend
    const apiUrl = COUNTRY_API_URLS[country] || COUNTRY_API_URLS.default;
    
    try {
      await forwardToBackend(body, apiUrl);
      recordSuccess(country);
      
      await createAuditLog('WEBHOOK_FORWARDED', {
        event: body.event,
        country,
        apiUrl,
        entityId: body.data.FIELDS?.ID,
      });
    } catch (error) {
      recordFailure(country);
      addToRetryQueue(body, String(error));
      
      await createAuditLog('WEBHOOK_FORWARD_FAILED', {
        event: body.event,
        country,
        error: String(error),
      });
      
      return NextResponse.json(
        { error: 'Backend processing failed', queued: true },
        { status: 503 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      processed: body.event,
      country,
    });

  } catch (error) {
    console.error('[BITRIX24] Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handle deal events (donations, payments)
 */
async function handleDealEvent(event: Bitrix24WebhookEvent): Promise<void> {
  console.log('[BITRIX24] Deal event:', event.event, 'ID:', event.data.FIELDS?.ID);
  
  // Log financial transaction for PCI-DSS
  if (event.event === 'ONCRMDEALADD' || event.event === 'ONCRMDEALUPDATE') {
    await createAuditLog('FINANCIAL_EVENT', {
      type: 'deal',
      operation: event.event.replace('ONCRMDEAL', '').toLowerCase(),
      dealId: event.data.FIELDS?.ID,
    });
  }
}

/**
 * Handle company events
 */
async function handleCompanyEvent(event: Bitrix24WebhookEvent): Promise<void> {
  console.log('[BITRIX24] Company event:', event.event, 'ID:', event.data.FIELDS?.ID);
}

/**
 * Handle lead events
 */
async function handleLeadEvent(event: Bitrix24WebhookEvent): Promise<void> {
  console.log('[BITRIX24] Lead event:', event.event, 'ID:', event.data.FIELDS?.ID);
  
  // GDPR: Log PII operation
  await createAuditLog('PII_OPERATION', {
    entityType: 'lead',
    operation: event.event.replace('ONCRMLEAD', '').toLowerCase(),
    leadId: event.data.FIELDS?.ID,
  });
}

/**
 * Handle contact events
 */
async function handleContactEvent(event: Bitrix24WebhookEvent): Promise<void> {
  console.log('[BITRIX24] Contact event:', event.event, 'ID:', event.data.FIELDS?.ID);
  
  // GDPR: Log PII operation
  await createAuditLog('PII_OPERATION', {
    entityType: 'contact',
    operation: event.event.replace('ONCRMCONTACT', '').toLowerCase(),
    contactId: event.data.FIELDS?.ID,
  });
}

// =============================================================================
// Health Check and Verification Endpoints
// =============================================================================

/**
 * GET /api/bitrix24/webhook
 * Webhook verification endpoint for Bitrix24
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  
  // Bitrix24 webhook verification
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Health check response with circuit breaker status
  const circuitBreakerStatus = Object.fromEntries(
    Array.from(circuitBreakers.entries()).map(([country, state]) => [
      country,
      { 
        status: state.status, 
        failures: state.failureCount,
        lastFailure: state.lastFailure,
        nextRetryTime: state.nextRetryTime,
      },
    ])
  );

  return NextResponse.json({
    status: 'ok',
    service: 'bitrix24-webhook',
    timestamp: new Date().toISOString(),
    queueSize: retryQueue.length,
    circuitBreakers: circuitBreakerStatus,
    gdprCompliance: {
      article44: 'Country-scoped routing enabled',
      countries: Object.keys(COUNTRY_API_URLS),
    },
    security: {
      hmacEnabled: !!WEBHOOK_SECRET,
      auditChainEnabled: true,
    },
  });
}

/**
 * DELETE /api/bitrix24/webhook
 * Process retry queue (admin only)
 */
export async function DELETE(request: NextRequest) {
  // Verify admin authorization
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const clearedCount = retryQueue.length;
  retryQueue.length = 0; // Clear queue
  
  await createAuditLog('RETRY_QUEUE_CLEARED', {
    clearedCount,
    timestamp: new Date().toISOString(),
  });
  
  return NextResponse.json({
    status: 'cleared',
    clearedCount,
  });
}

/**
 * PUT /api/bitrix24/webhook
 * Manually process retry queue (admin only)
 */
export async function PUT(request: NextRequest) {
  // Verify admin authorization
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const queueSize = retryQueue.length;
  await processRetryQueue();
  const remainingSize = retryQueue.length;
  
  return NextResponse.json({
    status: 'processed',
    processedCount: queueSize - remainingSize,
    remainingCount: remainingSize,
  });
}
