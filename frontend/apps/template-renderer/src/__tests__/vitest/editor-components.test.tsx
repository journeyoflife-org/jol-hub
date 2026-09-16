/**
 * Editor component tests — STEP 15 (vitest + RTL).
 *
 * BlockEditor / MediaUploader / ModerationQueue through their provider
 * stack, with fetch stubbed (no network — deterministic). Covers the
 * pilot gates, draft loading, file-type validation and the RBAC refusal.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders, MOCK_DRAFT, MOCK_MODERATION_QUEUE } from '@jol-hub/testing';
import { BlockEditor, MediaUploader, ModerationQueue } from '@/components/editor';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('BlockEditor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('BlockEditor.should.show the pilot notice when unconfigured', () => {
    renderWithProviders(
      <BlockEditor tenantSlug="test-church" pageId="tenant-editable" editorConfigured={false} basePath="/lt/test-church" />,
    );
    // saveUnconfigured copy — local draft only in the pilot.
    expect(document.body.textContent).toContain('juodraštis');
  });

  it('BlockEditor.should.load and render the backend draft', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/draft')) return jsonResponse(MOCK_DRAFT);
      return jsonResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(
      <BlockEditor tenantSlug="test-church" pageId="tenant-editable" editorConfigured basePath="/lt/test-church" />,
    );
    await waitFor(() => {
      // Paragraph text renders as content; the revision badge proves the
      // draft payload landed (heading text lives in an input's value).
      expect(document.body.textContent).toContain('Parapijos naujienos.');
      expect(document.body.textContent).toContain('Versija 3');
    });
    // Constraint UI present.
    expect(document.body.textContent).toContain('Pridėti bloką');
    // Draft fetch carried the tenant slug.
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('tenant=test-church');
  });

  it('BlockEditor.should.survive a failed draft fetch without crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'backend' }, 502)),
    );
    renderWithProviders(
      <BlockEditor tenantSlug="test-church" pageId="tenant-editable" editorConfigured basePath="/lt/test-church" />,
    );
    await waitFor(() => {
      expect(document.body.textContent).toContain('Pridėti bloką');
    });
  });
});

describe('MediaUploader', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([])));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('MediaUploader.should.render the pilot library notice when unconfigured', () => {
    renderWithProviders(<MediaUploader tenantSlug="test-church" editorConfigured={false} />);
    // mediaLibraryPilot copy — the library activates with the content plane.
    expect(document.body.textContent).toContain('Medijos biblioteka bus prieinama');
  });

  it('MediaUploader.should.reject disallowed file types client-side', async () => {
    renderWithProviders(<MediaUploader tenantSlug="test-church" editorConfigured />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();
    const gif = new File(['GIF89a'], 'anim.gif', { type: 'image/gif' });
    fireEvent.change(input!, { target: { files: [gif] } });
    await waitFor(() => {
      // mediaBadType copy — GIF is not in the allowlist (jpg/png/webp/svg).
      expect(document.body.textContent).toContain('Neleidžiamas failo tipas');
    });
  });
});

describe('ModerationQueue', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ModerationQueue.should.refuse to render without RBAC authorization', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderWithProviders(
      <ModerationQueue tenantSlug="test-church" editorConfigured authorized={false} reviewer="a@b.c" />,
    );
    expect(document.body.textContent).toContain('Neturite teisės');
    expect(fetchMock).not.toHaveBeenCalled(); // never fetches unauthenticated
  });

  it('ModerationQueue.should.show the pilot notice when unconfigured', () => {
    renderWithProviders(
      <ModerationQueue tenantSlug="test-church" editorConfigured={false} authorized reviewer="a@b.c" />,
    );
    expect(document.body.textContent).toContain('neaktyvuota');
  });

  it('ModerationQueue.should.render items and approve via the decision API', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.includes('/api/editor/moderation?')) return jsonResponse(MOCK_MODERATION_QUEUE);
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(
      <ModerationQueue tenantSlug="test-church" editorConfigured authorized reviewer="admin@example.com" />,
    );

    // Queue items arrive (pending page-edit + Art. 9 media item).
    await waitFor(() => {
      expect(document.body.textContent).toContain('Puslapio redagavimas');
    });
    expect(document.body.textContent).toContain('Medijos įkėlimas');

    // Expand the first item, then approve it.
    const expandButtons = screen.getAllByRole('button', { name: 'Išskleisti' });
    fireEvent.click(expandButtons[0]!);
    const approveButton = await screen.findByRole('button', { name: 'Patvirtinti' });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(calls.some((c) => c.startsWith('POST') && c.includes('/api/editor/moderation/mod-1'))).toBe(true);
    });
  });
});
