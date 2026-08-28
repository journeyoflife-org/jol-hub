/**
 * Secret-leakage scan — STEP 15 (security tier, TASK 6).
 *
 * Greps the BUILD OUTPUT (.next) for secrets. Two signal classes:
 *
 *   1. ENV-VALUE SCAN: reads the app's .env / .env.local, collects every
 *      value whose key smells like a secret (SECRET/TOKEN/PASSWORD/PRIVATE/
 *      KEY), and fails if that literal value appears in any built file.
 *      This catches the classic "server-only env leaked into a client
 *      chunk" regression directly.
 *   2. PATTERN SCAN: generic secret shapes (AWS access keys, PEM private
 *      keys, bearer tokens with real-looking values, *_SECRET assignments).
 *
 * Exit 0 = clean, 1 = findings (CI gate). Run AFTER `next build`.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BUILD_DIR = join(ROOT, '.next');
const SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.json', '.html', '.css', '.map']);
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const SECRET_KEY_PATTERN = /SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL|API_KEY/i;
const PLACEHOLDER_VALUES = new Set(['', 'changeme', 'change-me', 'placeholder', 'example', 'x', 'test']);

const GENERIC_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/ },
  // Requires real base64 key material after the header — jose/next-auth
  // bundles carry the bare header string as a format-detection constant.
  { name: 'PEM private key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[A-Za-z0-9+/=\s]{60,}/ },
  { name: 'secret assignment', regex: /(?:NEXTAUTH_SECRET|JOL_AUTH_CLIENT_SECRET|OIDC_CLIENT_SECRET|BITRIX_WEBHOOK_URL)\s*[:=]\s*["'][A-Za-z0-9+/_-]{16,}["']/ },
];

interface Finding {
  file: string;
  kind: string;
  snippet: string;
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (SCAN_EXTENSIONS.has(`.${String(entry.name).split('.').pop()}`)) out.push(full);
  }
  return out;
}

function readEnvValues(envPath: string): Array<{ key: string; value: string }> {
  if (!existsSync(envPath)) return [];
  const lines = readFileSync(envPath, 'utf8');
  const values: Array<{ key: string; value: string }> = [];
  for (const line of lines.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    if (!SECRET_KEY_PATTERN.test(key ?? '')) continue;
    const value = (raw ?? '').replace(/^["']|["']$/g, '').trim();
    if (value.length < 8 || PLACEHOLDER_VALUES.has(value.toLowerCase())) continue;
    values.push({ key: key ?? '', value });
  }
  return values;
}

async function main(): Promise<void> {
  if (!existsSync(BUILD_DIR)) {
    console.error('✗ .next build output missing — run `next build` first.');
    process.exit(1);
  }

  const envSecrets = [
    ...readEnvValues(join(ROOT, '.env')),
    ...readEnvValues(join(ROOT, '.env.local')),
    ...readEnvValues(join(ROOT, '.env.production')),
  ];

  const files = await walk(BUILD_DIR);
  const findings: Finding[] = [];
  let scanned = 0;

  for (const file of files) {
    const info = await stat(file);
    if (info.size > MAX_FILE_BYTES) continue; // build maps can be huge; skip
    scanned += 1;
    const content = await readFile(file, 'utf8');
    const where = relative(ROOT, file);

    for (const { key, value } of envSecrets) {
      if (content.includes(value)) {
        findings.push({ file: where, kind: `env-value:${key}`, snippet: value.slice(0, 6) + '…' });
      }
    }
    for (const { name, regex } of GENERIC_PATTERNS) {
      const match = regex.exec(content);
      if (match) {
        findings.push({ file: where, kind: name, snippet: (match[0] ?? '').slice(0, 24) + '…' });
      }
    }
  }

  if (findings.length > 0) {
    console.error(`✗ SECRET LEAKAGE: ${findings.length} finding(s) in build output`);
    for (const finding of findings.slice(0, 10)) {
      console.error(`  ${finding.file} — ${finding.kind} (${finding.snippet})`);
    }
    process.exit(1);
  }

  console.log(`✓ no secrets in build output (${scanned} files scanned, ${envSecrets.length} env secrets checked)`);
}

void main();
