/**
 * ContentModule — structured rich content (STEP 6 module).
 *
 * Content (from PageConfig): `nodes` (ContentNode[]) rendered via the ui
 * ContentBlock. A special `kind: 'config-error'` renders the translated
 * fallback notice used when a page config failed validation (no literals).
 */
import { ContentBlock } from '@jol-hub/ui/components/composite';
import type { ContentNode } from '@jol-hub/ui/components/composite';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import type { ModuleProps } from './types';

export default function ContentModule({ content, locale }: ModuleProps) {
  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  if (content.kind === 'config-error') {
    const messages = getMessages(effectiveLocale);
    return (
      <div
        data-jol-content="config-error"
        role="note"
        className="rounded-lg border border-warning bg-warning/10 p-6 text-sm"
      >
        {translate(messages, 'errors.generic')}
      </div>
    );
  }

  const nodes = Array.isArray(content.nodes) ? (content.nodes as ContentNode[]) : [];
  if (nodes.length === 0) return null;

  const contentId = typeof content.contentId === 'string' ? content.contentId : undefined;
  return <ContentBlock nodes={nodes} contentId={contentId} />;
}
