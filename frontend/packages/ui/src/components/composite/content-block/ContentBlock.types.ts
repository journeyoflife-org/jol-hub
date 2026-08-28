/** Structured rich-content node rendered by {@link ContentBlock}. */
export type ContentNode =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'blockquote'; text: string; citation?: string }
  | {
      type: 'image';
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
    }
  | { type: 'embed'; html: string; title: string };

/** Props for {@link ContentBlock}. */
export interface ContentBlockProps {
  /** Content nodes, rendered in order. */
  nodes: ContentNode[];
  /**
   * Marks the area as tenant-editable for moderation tooling
   * (`data-jol-content`). Defaults to true.
   */
  editable?: boolean;
  /** Logical content id used by moderation tooling. */
  contentId?: string;
  /** Extra class name. */
  className?: string;
}
