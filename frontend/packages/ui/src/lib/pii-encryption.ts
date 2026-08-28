/**
 * Client-side PII Encryption Utilities
 * AES-256-GCM encryption for sensitive form data
 * GDPR Art. 32 - Security of Processing
 */

/**
 * Generate a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random initialization vector
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  version: string;
}

/**
 * PII Field types that require encryption
 */
export type PIIField = 
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'address'
  | 'dateOfBirth'
  | 'baptismName'
  | 'confirmationName'
  | 'marriageSpouseName';

/**
 * Encryption configuration for a form
 */
export interface EncryptionConfig {
  /** Organization ID for key derivation */
  organizationId: string;
  /** Form identifier */
  formId: string;
  /** Fields to encrypt */
  fields: PIIField[];
  /** Encryption version */
  version?: string;
}

const ENCRYPTION_VERSION = '1.0';

/**
 * Encrypt sensitive form data using AES-256-GCM
 * 
 * @param data - Plain text data to encrypt
 * @param encryptionKey - Organization-specific encryption key
 * @returns Encrypted data object
 */
export async function encryptPII(
  data: string,
  encryptionKey: string
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(encryptionKey, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoder.encode(data)
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    version: ENCRYPTION_VERSION,
  };
}

/**
 * Decrypt sensitive form data
 * 
 * @param encryptedData - Encrypted data object
 * @param encryptionKey - Organization-specific encryption key
 * @returns Decrypted plain text
 */
export async function decryptPII(
  encryptedData: EncryptedData,
  encryptionKey: string
): Promise<string> {
  const decoder = new TextDecoder();
  const salt = new Uint8Array(base64ToBuffer(encryptedData.salt));
  const iv = new Uint8Array(base64ToBuffer(encryptedData.iv));
  const ciphertext = base64ToBuffer(encryptedData.ciphertext);
  const key = await deriveKey(encryptionKey, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext
  );

  return decoder.decode(decryptedBuffer);
}

/**
 * Encrypt an object containing PII fields
 * 
 * @param formData - Form data object
 * @param config - Encryption configuration
 * @param encryptionKey - Organization-specific encryption key
 * @returns Form data with encrypted PII fields
 */
export async function encryptFormData<T extends Record<string, unknown>>(
  formData: T,
  config: EncryptionConfig,
  encryptionKey: string
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { ...formData };
  const encryptedFields: string[] = [];

  for (const field of config.fields) {
    const value = formData[field];
    if (value && typeof value === 'string') {
      result[field] = await encryptPII(value, encryptionKey);
      encryptedFields.push(field);
    }
  }

  // Add metadata for audit trail
  result._encryption = {
    formId: config.formId,
    organizationId: config.organizationId,
    fields: encryptedFields,
    version: config.version || ENCRYPTION_VERSION,
    timestamp: new Date().toISOString(),
  };

  return result;
}

/**
 * Check if Web Crypto API is available
 */
export function isEncryptionAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.encrypt === 'function';
}

/**
 * Generate a secure random encryption key
 * This should be done server-side and stored securely
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return bufferToBase64(key);
}

/**
 * Hash a value using SHA-256 (for pseudonymization)
 * GDPR Art. 32 - Pseudonymization
 */
export async function hashForPseudonymization(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

/**
 * PII Form Encryption Hook
 * React hook for encrypting form data
 */
export function usePIIEncryption(config: EncryptionConfig) {
  const [encryptionKey, setEncryptionKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Fetch organization's public encryption key from backend
    fetch(`/api/organizations/${config.organizationId}/encryption-key`)
      .then(res => res.json())
      .then(data => setEncryptionKey(data.key))
      .catch(console.error);
  }, [config.organizationId]);

  const encrypt = React.useCallback(async <T extends Record<string, unknown>>(
    formData: T
  ): Promise<Record<string, unknown> | null> => {
    if (!encryptionKey) return null;
    return encryptFormData(formData, config, encryptionKey);
  }, [config, encryptionKey]);

  return {
    encrypt,
    isReady: !!encryptionKey,
    isEncryptionAvailable: isEncryptionAvailable(),
  };
}

// Import React for the hook (conditionally for SSR)
import * as React from 'react';
