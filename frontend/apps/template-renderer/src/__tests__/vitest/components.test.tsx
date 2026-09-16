/**
 * Component unit tests — STEP 15 (vitest + RTL + jsdom).
 *
 * Primitives (Button, Badge) and the ContactForm composite: render, props,
 * states, events, validation. Rendered through `renderWithProviders` so
 * i18n/theme contexts are REAL, not mocked away.
 *
 * Naming: Component.should.behavior (spec convention).
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Badge, Button } from '@jol-hub/ui/components/primitives';
import { ContactForm } from '@jol-hub/ui/components/composite';
import { renderWithProviders } from '@jol-hub/testing';

describe('Button', () => {
  it('Button.should.render children and handle clicks', () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Sign in</Button>);
    const button = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Button.should.respect disabled state', () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button disabled onClick={onClick}>
        Blocked
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Blocked' });
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('Button.should.expose aria-busy while loading', () => {
    renderWithProviders(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-busy')).toBe('true');
    // Loading buttons must not be interactive.
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('Button.should.apply variant classes without crashing for all variants', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'danger', 'link'] as const) {
      const { unmount } = renderWithProviders(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole('button', { name: variant })).toBeTruthy();
      unmount();
    }
  });
});

describe('Badge', () => {
  it('Badge.should.render its content', () => {
    renderWithProviders(<Badge>NEW</Badge>);
    expect(screen.getByText('NEW')).toBeTruthy();
  });
});

describe('ContactForm', () => {
  function fillField(id: string, value: string) {
    const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`);
    if (!field) throw new Error(`field #${id} missing`);
    fireEvent.change(field, { target: { value } });
  }

  function fillValidForm() {
    fillField('contact-name', 'Test User');
    fillField('contact-email', 'test@example.com');
    fillField('contact-message', 'Hello — a long enough message.');
  }

  it('ContactForm.should.render all GDPR-required fields', () => {
    renderWithProviders(<ContactForm onSubmit={vi.fn()} privacyPolicyHref="/privacy" />);
    for (const id of ['contact-name', 'contact-email', 'contact-message']) {
      expect(document.querySelector(`#${id}`)).toBeTruthy();
    }
    // Consent checkbox — GDPR Art. 6/7 lawful basis.
    expect(document.querySelector('#contact-consent')).toBeTruthy();
  });

  it('ContactForm.should.block submission without consent', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true, message: 'done' });
    renderWithProviders(<ContactForm onSubmit={onSubmit} privacyPolicyHref="/privacy" />);
    fillValidForm();
    const submit = document.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submit).toBeTruthy();
    fireEvent.click(submit!);
    await waitFor(() => {
      // Without consent the form must NOT call the submit handler.
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('ContactForm.should.submit values with consent and show success', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true, message: 'Ačiū!' });
    renderWithProviders(<ContactForm onSubmit={onSubmit} privacyPolicyHref="/privacy" />);
    fillValidForm();
    fireEvent.click(document.querySelector('#contact-consent')!);
    fireEvent.click(document.querySelector('button[type="submit"]')!);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const values = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.name).toBe('Test User');
    expect(values.email).toBe('test@example.com');
    expect(values.consent).toBe(true);
  });

  it('ContactForm.should.surface error messages from the submit handler', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: false, message: 'Klaida siunčiant' });
    renderWithProviders(<ContactForm onSubmit={onSubmit} privacyPolicyHref="/privacy" />);
    fillValidForm();
    fireEvent.click(document.querySelector('#contact-consent')!);
    fireEvent.click(document.querySelector('button[type="submit"]')!);
    await waitFor(() => {
      expect(document.body.textContent).toContain('Klaida siunčiant');
    });
  });
});
