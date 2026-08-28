/**
 * Ambient declaration for the test suite only: `react-dom/server` ships
 * without its own declaration file and `@types/react-dom` is intentionally
 * NOT a dependency of this package (adding it re-resolved react-dom peers
 * workspace-wide — lockfile drift rejected). The full type surface is not
 * needed here; tests use `renderToStaticMarkup` only.
 */
declare module 'react-dom/server' {
  import type { ReactElement } from 'react';
  export function renderToStaticMarkup(element: ReactElement): string;
}
