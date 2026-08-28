# CourseList

Course listing (title/description/schedule/level cards) for education
surfaces. Schedule and level meta carry sr-only labels from the LT/EN/RU
catalogs (programmatic association). JSON-LD (`Course`) is emitted by the
renderer via the SEO builder — this component is presentation-only.

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 24 | Courses/education page | primary list module |
| 07 | Parish church landing | optional faith-formation block (same component) |

Renderer module mapping: `course-list`.

## Accessibility

- `<ul>/<li>` semantics; linked titles get `focus-ring`.
- sr-only labels for schedule/level (DS-A11Y-10 pattern).
- Empty state is an externalized string.
- Covered by `check-a11y` via the Showcase render.
