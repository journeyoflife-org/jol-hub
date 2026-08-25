/**
 * Security tests — STEP 15 (GDPR Art. 32 / SOC 2 CC7.2 evidence).
 *
 *   1. XSS — the canonical payload battery through the REAL render +
 *      DOMPurify pipeline (editor preview path);
 *   2. URL policy — javascript:/data:/spoofed-host rejection;
 *   3. Auth bypass — RBAC matrix across roles and tenant boundaries;
 *   4. Tenant isolation — slug injection rejected at every edge schema.
 *
 * CSRF posture (documented, not unit-testable): all mutating routes are
 * same-origin JSON APIs behind SameSite=Lax session cookies; the backend
 * re-checks tenant roles before persisting (defense in depth).
 */
import { describe, expect, it } from 'vitest';
import DOMPurify from 'dompurify';
import type { AuthSession } from '@jol-hub/auth/oidc';
import { hasRole, isAdmin, isSuperAdmin } from '@jol-hub/auth/oidc';
import { XSS_PAYLOADS } from '@jol-hub/testing';
import {
  renderDraftHtml,
  isSafeUrl,
  SANITIZED_ALLOWED_TAGS,
} from '@/lib/editor/sanitize';
import { draftBodySchema, decisionBodySchema, uploadBodySchema } from '@/lib/editor/validation';

/** Attribute allowlist — mirrors BlockEditor's preview sanitize config. */
const PURIFY_ALLOWED_ATTR = [
  'href', 'rel', 'alt', 'type', 'data-media-id', 'data-spacer', 'data-block',
];

// =============================================================================
// 1. XSS — preview pipeline (escape-first render + DOMPurify final layer)
// =============================================================================

function sanitizeAsPreview(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...SANITIZED_ALLOWED_TAGS],
    ALLOWED_ATTR: [...PURIFY_ALLOWED_ATTR],
  });
}

describe('XSS defense (editor preview pipeline)', () => {
  for (const payload of XSS_PAYLOADS) {
    it(`XSS.should.defuse payload: ${payload.slice(0, 40)}`, () => {
      const html = renderDraftHtml([
        { id: 'x1', type: 'paragraph', text: payload },
        { id: 'x2', type: 'heading', text: payload },
        { id: 'x3', type: 'quote', text: payload },
        { id: 'x4', type: 'button', label: payload },
      ]);
      const sanitized = sanitizeAsPreview(html);

      const doc = new DOMParser().parseFromString(sanitized, 'text/html');
      // No executable surfaces may survive.
      for (const tag of ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'form']) {
        expect(doc.querySelectorAll(tag).length, `surviving <${tag}>`).toBe(0);
      }
      // No inline event handlers on any element.
      for (const element of Array.from(doc.body.querySelectorAll('*'))) {
        for (const attr of Array.from(element.attributes)) {
          expect(attr.name.startsWith('on'), `${attr.name} survived`).toBe(false);
          expect(attr.value.trim().toLowerCase().startsWith('javascript:')).toBe(false);
        }
      }
      // Payloads survive only as inert TEXT.
      expect(doc.body.textContent).toContain(payload);
    });
  }

  it('XSS.should.remain inert even if a hostile href reached the renderer', () => {
    const html = renderDraftHtml([
      {
        id: 'x5',
        type: 'button',
        label: 'click',
        href: 'javascript:alert(document.cookie)',
      },
    ]);
    const sanitized = sanitizeAsPreview(html);
    expect(sanitized).not.toContain('javascript:');
  });
});

// =============================================================================
// 2. URL policy
// =============================================================================

describe('URL policy (isSafeUrl)', () => {
  const BLOCKED = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'http://gyvenimo-kelias.lt/x', // protocol downgrade
    'https://gyvenimo-kelias.lt.evil.example/', // suffix spoofing
    '//evil.example/x', // protocol-relative
    '/\\evil.example', // backslash path trick
    'https://evil.example/', // outside allowlist
  ];
  for (const href of BLOCKED) {
    it(`URL.should.reject ${href}`, () => {
      expect(isSafeUrl(href)).toBe(false);
    });
  }

  it('URL.should.allow internal paths and allowlisted https hosts', () => {
    expect(isSafeUrl('/apie-mus')).toBe(true);
    expect(isSafeUrl('https://gyvenimo-kelias.lt/naujienos')).toBe(true);
  });
});

// =============================================================================
// 3. Auth bypass — RBAC matrix
// =============================================================================

type Role = 'admin' | 'editor' | 'clergy' | 'viewer';

function session(role: Role | null, opts: { slug?: string; platform?: 'superadmin' } = {}): AuthSession {
  return {
    user: {
      sub: 'u1',
      email: 'user@example.com',
      name: 'Test',
      roles: role ? [{ tenantSlug: opts.slug ?? 'test-church', role }] : [],
      platformRole: opts.platform,
      mfaEnrolled: false,
    },
    expiresAt: new Date('2099-01-01').getTime(),
  } as unknown as AuthSession;
}

describe('auth bypass (RBAC matrix)', () => {
  it('RBAC.should.deny admin routes for non-admin roles', () => {
    for (const role of ['editor', 'clergy', 'viewer'] as Role[]) {
      expect(isAdmin(session(role), 'test-church'), `role=${role}`).toBe(false);
    }
  });

  it('RBAC.should.deny everything for unauthenticated users', () => {
    expect(isAdmin(null, 'test-church')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(hasRole(null, 'test-church', 'editor')).toBe(false);
  });

  it('RBAC.should.allow tenant admin only within their own tenant', () => {
    const admin = session('admin');
    expect(isAdmin(admin, 'test-church')).toBe(true);
    // Cross-tenant: another tenant's admin has NO power here.
    expect(isAdmin(admin, 'other-tenant')).toBe(false);
  });

  it('RBAC.should.allow JOL superadmin to override (platform role)', () => {
    const sa = session(null, { platform: 'superadmin' });
    expect(isSuperAdmin(sa)).toBe(true);
    expect(isAdmin(sa, 'any-tenant')).toBe(true);
    expect(hasRole(sa, 'any-tenant', 'editor')).toBe(true);
  });

  it('RBAC.should.scope editor role for publishing, not moderation', () => {
    const editor = session('editor');
    expect(hasRole(editor, 'test-church', 'editor')).toBe(true);
    expect(isAdmin(editor, 'test-church')).toBe(false);
  });
});

// =============================================================================
// 4. Tenant isolation — slug injection at every edge schema
// =============================================================================

describe('tenant isolation (slug injection)', () => {
  const HOSTILE_SLUGS = [
    'BAD_SLUG', // uppercase
    '../shared', // path traversal flavor
    'tenant;DROP', // SQL flavor
    '-leading', // leading hyphen
    'a'.repeat(65), // over-length
    'ünïcode', // non-ASCII
    'tenant\x00name', // NUL byte
  ];

  for (const slug of HOSTILE_SLUGS) {
    it(`slug.should.reject "${slug.slice(0, 24)}" in draft schema`, () => {
      const result = draftBodySchema.safeParse({
        tenantSlug: slug,
        revision: 0,
        blocks: [],
      });
      expect(result.success).toBe(false);
    });

    it(`slug.should.reject "${slug.slice(0, 24)}" in decision schema`, () => {
      const result = decisionBodySchema.safeParse({
        tenantSlug: slug,
        action: 'approve',
      });
      expect(result.success).toBe(false);
    });

    it(`slug.should.reject "${slug.slice(0, 24)}" in upload schema`, () => {
      const result = uploadBodySchema.safeParse({
        tenantSlug: slug,
        fileName: 'x.webp',
        mimeType: 'image/webp',
        sizeBytes: 10,
        altText: 'ok',
      });
      expect(result.success).toBe(false);
    });
  }
});
