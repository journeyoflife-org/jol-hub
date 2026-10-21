# Vendored Webfonts

Self-hosted variable font files for the JOL design system.
These are served via `next/font/local` — no external CDN requests, GDPR-compliant.

## Fonts

| File | Family | License |
|------|--------|---------|
| `Inter.var.woff2` | Inter (sans) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| `SourceSerif4Variable-Roman.woff2` | Source Serif 4 (serif) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| `SourceSerif4Variable-It.woff2` | Source Serif 4 Italic | [SIL OFL 1.1](https://scripts.sil.org/OFL) |

## Sources

- Inter: <https://github.com/rsms/inter> (Rasmus Andersson)
- Source Serif 4: <https://github.com/adobe-fonts/source-serif> (Adobe)

## Usage

```tsx
import localFont from 'next/font/local';

const inter = localFont({
  src: './Inter.var.woff2',
  variable: '--font-inter',
});

const serif = localFont({
  src: [
    { path: './SourceSerif4Variable-Roman.woff2', style: 'normal' },
    { path: './SourceSerif4Variable-It.woff2', style: 'italic' },
  ],
  variable: '--font-serif',
});
```

Font files are referenced from app layouts via the `@journeyoflife-org/ui` package path:

```tsx
import localFont from 'next/font/local';

const inter = localFont({
  src: '../../packages/ui/fonts/Inter.var.woff2',
  variable: '--font-inter',
});
```
