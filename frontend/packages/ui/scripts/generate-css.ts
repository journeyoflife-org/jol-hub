/**
 * Generates `src/styles/tokens.css` from the TypeScript design tokens.
 *
 * Single source of truth: TS tokens → CSS custom properties. Run via
 * `pnpm generate:tokens` and commit the output (it ships with the package).
 *
 * Variable naming: `--jol-color-<scale>-<stop>`, `--jol-<role>`,
 * `--jol-space-*`, `--jol-radius-*`, `--jol-shadow-*`, `--jol-font-*`.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { colorScales, themeRoles, verticalAccents } from '../src/tokens/colors';
import { fontFamilies } from '../src/tokens/typography';
import { spacingScale, spacingSemantic } from '../src/tokens/spacing';
import { radii } from '../src/tokens/radii';
import { shadows } from '../src/tokens/shadows';

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, '..', 'src', 'styles', 'tokens.css');

const lines: string[] = [];

lines.push('/**');
lines.push(' * GENERATED FILE — do not edit by hand.');
lines.push(' * Source: packages/ui/src/tokens/* (run `pnpm generate:tokens`).');
lines.push(' */');
lines.push('');

/* :root — light values ---------------------------------------------- */
lines.push(':root {');
for (const [scaleName, scale] of Object.entries(colorScales)) {
  for (const [stop, value] of Object.entries(scale)) {
    const suffix = stop === 'DEFAULT' ? '' : `-${stop}`;
    lines.push(`  --jol-color-${scaleName}${suffix}: ${value};`);
  }
}
for (const [role, value] of Object.entries(themeRoles.light)) {
  lines.push(`  --jol-${role.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`);
}
for (const [name, value] of Object.entries(verticalAccents)) {
  lines.push(`  --jol-vertical-${name}: ${value};`);
}
for (const [name, value] of Object.entries(spacingScale)) {
  lines.push(`  --jol-space-${name}: ${value};`);
}
for (const [name, value] of Object.entries(spacingSemantic)) {
  lines.push(`  --jol-space-${name}: ${value};`);
}
for (const [name, value] of Object.entries(radii)) {
  lines.push(`  --jol-radius-${name}: ${value};`);
}
for (const [name, value] of Object.entries(shadows)) {
  lines.push(`  --jol-shadow-${name}: ${value};`);
}
for (const [name, value] of Object.entries(fontFamilies)) {
  lines.push(`  --jol-font-${name}: ${value};`);
}
lines.push('}');
lines.push('');

/* .dark — explicit dark mode ----------------------------------------- */
const darkVars = (): void => {
  for (const [role, value] of Object.entries(themeRoles.dark)) {
    lines.push(
      `  --jol-${role.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`,
    );
  }
};

lines.push('.dark {');
darkVars();
lines.push('}');
lines.push('');

/* prefers-color-scheme fallback (no-JS / pre-hydration) -------------- */
lines.push('@media (prefers-color-scheme: dark) {');
lines.push('  :root:not(.light):not(.dark) {');
darkVars();
lines.push('  }');
lines.push('}');
lines.push('');

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, lines.join('\n'), 'utf8');
console.log(`tokens.css written → ${outFile} (${lines.length} lines)`);
