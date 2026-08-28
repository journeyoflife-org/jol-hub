# ChatbotEntry

AI-GATED entry shell (public FAQPage shell ONLY, DS §6). HIDDEN BY DEFAULT:
without `enabled` the component renders nothing — "hidden, not degraded"
(Phase 2.2 batch 3). O-010 (safety.yml crisis data) is the absolute launch
blocker; until it lands, consumers never pass `enabled`. Even enabled, the
shell only links to the public FAQ page — no AI backend contact, no
conversation surface, no data collection.

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 21 | AI assistant entry page | gated entry point (hidden until O-010 + AI gate) |

## Accessibility

- Link target: `focus-ring`, ≥24px inline-flex target.
- Label externalized (`collections.chatbotEntryLabel`).
- Hidden state = no DOM at all (screen readers announce nothing).
- Covered by `check-a11y` via the Showcase render (enabled instance).
