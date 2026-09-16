/**
 * Revision diff — STEP 14 (history + moderation before/after).
 *
 * Pure structural diff between two block lists keyed by block id. Used by:
 *   - the editor's revision history (last 10 revisions, diff view);
 *   - the moderation queue's before/after comparison.
 *
 * Content-level detail: changed text blocks report a compact field summary
 * (which properties changed), not a character diff — enough for a reviewer
 * to see WHAT moved without a full diff engine.
 */
import type { EditorBlock } from './blocks';

export type BlockChangeKind = 'added' | 'removed' | 'changed' | 'moved';

export interface BlockChange {
  kind: BlockChangeKind;
  blockId: string;
  type: EditorBlock['type'];
  /** For `changed`: the properties that differ. */
  fields?: string[];
  /** From/to positions for `moved`. */
  fromIndex?: number;
  toIndex?: number;
}

/** Properties compared when detecting changes (order-independent). */
const COMPARED_FIELDS: readonly (keyof EditorBlock)[] = [
  'type', 'text', 'mediaId', 'altText', 'label', 'href', 'size',
];

function fieldEqual(a: EditorBlock, b: EditorBlock, field: keyof EditorBlock): boolean {
  return JSON.stringify(a[field] ?? null) === JSON.stringify(b[field] ?? null);
}

/**
 * Diff `before` → `after`. Deterministic ordering: added/moved/changed in
 * `after` order, then removals in `before` order.
 */
export function diffBlocks(before: readonly EditorBlock[], after: readonly EditorBlock[]): BlockChange[] {
  const changes: BlockChange[] = [];
  const beforeById = new Map(before.map((block, index) => [block.id, { block, index }]));
  const afterById = new Map(after.map((block, index) => [block.id, { block, index }]));

  for (const [index, block] of after.entries()) {
    const previous = beforeById.get(block.id);
    if (!previous) {
      changes.push({ kind: 'added', blockId: block.id, type: block.type, toIndex: index });
      continue;
    }
    if (previous.index !== index) {
      changes.push({
        kind: 'moved',
        blockId: block.id,
        type: block.type,
        fromIndex: previous.index,
        toIndex: index,
      });
    }
    const fields = COMPARED_FIELDS.filter((field) => !fieldEqual(previous.block, block, field));
    const marksChanged = JSON.stringify(previous.block.marks ?? []) !== JSON.stringify(block.marks ?? []);
    const linksChanged = JSON.stringify(previous.block.links ?? []) !== JSON.stringify(block.links ?? []);
    if (marksChanged) fields.push('marks');
    if (linksChanged) fields.push('links');
    if (fields.length > 0) {
      changes.push({ kind: 'changed', blockId: block.id, type: block.type, fields });
    }
  }

  for (const [index, block] of before.entries()) {
    if (!afterById.has(block.id)) {
      changes.push({ kind: 'removed', blockId: block.id, type: block.type, fromIndex: index });
    }
  }

  return changes;
}

/** Human-readable one-line summary per change (audit/diff views). */
export function describeChange(change: BlockChange): string {
  switch (change.kind) {
    case 'added':
      return `${change.type} block added at position ${(change.toIndex ?? 0) + 1}`;
    case 'removed':
      return `${change.type} block removed from position ${(change.fromIndex ?? 0) + 1}`;
    case 'moved':
      return `${change.type} block moved ${(change.fromIndex ?? 0) + 1} → ${(change.toIndex ?? 0) + 1}`;
    case 'changed':
      return `${change.type} block changed: ${(change.fields ?? []).join(', ')}`;
    default:
      return 'block changed';
  }
}
