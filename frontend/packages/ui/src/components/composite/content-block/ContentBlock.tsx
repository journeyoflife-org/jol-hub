/**
 * ContentBlock — structured rich-text renderer (Markdown-like node list).
 *
 * Tenant-editable areas are marked with `data-jol-content` so moderation
 * tooling can target them. Embeds render inside a sandboxed iframe with a
 * mandatory title (WCAG 4.1.2).
 */
import { cn } from '../../../lib/utils';
import type { ContentBlockProps, ContentNode } from './ContentBlock.types';

function NodeView({ node }: { node: ContentNode }) {
  switch (node.type) {
    case 'heading': {
      const Heading = `h${node.level}` as const;
      return (
        <Heading className="mt-8 font-heading text-2xl font-semibold text-neutral-900 first:mt-0 dark:text-neutral-50">
          {node.text}
        </Heading>
      );
    }
    case 'paragraph':
      return <p className="mt-4 leading-relaxed text-neutral-700 first:mt-0 dark:text-neutral-200">{node.text}</p>;
    case 'list': {
      const items = node.items.map((item, index) => <li key={index}>{item}</li>);
      return node.ordered ? (
        <ol className="mt-4 list-decimal space-y-1 ps-6 text-neutral-700 dark:text-neutral-200">{items}</ol>
      ) : (
        <ul className="mt-4 list-disc space-y-1 ps-6 text-neutral-700 dark:text-neutral-200">{items}</ul>
      );
    }
    case 'blockquote':
      return (
        <blockquote className="mt-4 border-s-4 border-liturgical-gold ps-4 italic text-neutral-700 dark:text-neutral-200">
          <p>{node.text}</p>
          {node.citation && <footer className="mt-1 text-sm not-italic text-neutral-500">— {node.citation}</footer>}
        </blockquote>
      );
    case 'image':
      return (
        <figure className="mt-4">
          <img
            src={node.src}
            alt={node.alt}
            width={node.width}
            height={node.height}
            loading="lazy"
            className="h-auto w-full rounded-lg"
          />
          {node.caption && <figcaption className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{node.caption}</figcaption>}
        </figure>
      );
    case 'embed':
      return (
        <div className="mt-4 aspect-video">
          <iframe
            title={node.title}
            srcDoc={node.html}
            sandbox="allow-scripts"
            loading="lazy"
            className="h-full w-full rounded-lg border border-neutral-200 dark:border-neutral-800"
          />
        </div>
      );
    default:
      return null;
  }
}

export function ContentBlock({ nodes, editable = true, contentId, className }: ContentBlockProps) {
  return (
    <div
      data-jol-content={editable ? 'true' : undefined}
      data-content-id={contentId}
      className={cn('max-w-prose', className)}
    >
      {nodes.map((node, index) => (
        <NodeView key={index} node={node} />
      ))}
    </div>
  );
}
