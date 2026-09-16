/**
 * Provider-aware render — STEP 15.
 *
 * `renderWithProviders` wraps UI in the same provider stack the apps use
 * (theme → i18n → optional app wrapper such as TenantProvider), so
 * component tests exercise real context behavior instead of shallow mocks.
 *
 * The optional `wrapper` composes OUTSIDE the i18n provider — apps pass
 * their own providers (e.g. the renderer's TenantProvider, next-auth
 * SessionProvider) without this package depending on app code.
 */
import type { ReactElement, ReactNode, ComponentType } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { TranslationProvider, getMessages } from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';
import { ThemeProvider } from '@jol-hub/ui/providers';

export interface RenderWithProvidersOptions {
  locale?: SupportedLocale;
  /** Vertical/tenant overlay for getMessages (defaults to common catalog). */
  messagesOverrides?: { vertical?: string };
  /** App-level provider composed OUTSIDE i18n (TenantProvider, etc.). */
  wrapper?: ComponentType<{ children: ReactNode }>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const locale = options.locale ?? 'lt';
  const messages = getMessages(locale, options.messagesOverrides ?? {});
  const Wrapper = options.wrapper;

  function TestProviders({ children }: { children: ReactNode }) {
    const tree = Wrapper ? <Wrapper>{children}</Wrapper> : children;
    return (
      <ThemeProvider defaultPreference="light">
        <TranslationProvider locale={locale} messages={messages}>
          {tree}
        </TranslationProvider>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: TestProviders });
}
