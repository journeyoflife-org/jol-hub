# OnboardingSteps

Ordered progress list for education journeys (page package 24; DS §6 backlog
pair of CourseList). `<ol>` semantics with `aria-current="step"` on the
active step; statuses drive visual treatment only.

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 24 | Courses/education page | enrollment journey steps |

Renderer module mapping: `onboarding` module.

## Accessibility

- `<ol>/<li>` semantics; `aria-current="step"` marks progress.
- Step numbers aria-hidden (list semantics convey order).
- Covered by `check-a11y` via the Showcase render.
