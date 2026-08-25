/**
 * Structured logger — STEP 16 (SOC 2 CC7.2 / ISO 27001 A.8.15).
 *
 * Zero-dependency, JSON-lines, level-gated, auto-redacting. Runs on the
 * Node server, in the browser and in the Next.js edge middleware (no
 * node:* imports). Output is one JSON object per line on stdout — the
 * container/Promtail shape Loki expects.
 *
 * RULES honored:
 *   - production NEVER logs below `info` (level gate default);
 *   - every record carries `time`, `level`, `msg`, `service`;
 *   - context (tenant, locale, requestId, page) rides `child()` bindings;
 *   - all fields are deep-redacted before serialization (see redact.ts).
 */
import { redactText, redactValue } from './redact';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

/** One structured log record (after redaction). */
export interface LogRecord {
  time: string;
  level: LogLevel;
  msg: string;
  service: string;
  [key: string]: unknown;
}

/** Where serialized records go. Default: stdout via console. */
export type LogSink = (line: string, record: LogRecord) => void;

export interface LoggerOptions {
  service: string;
  /** Minimum level to emit. Defaults to `info` (production-safe). */
  minLevel?: LogLevel;
  /** Static bindings merged into every record (tenant, env, version…). */
  bindings?: Record<string, unknown>;
  sink?: LogSink;
  /** Injectable clock — tests stay deterministic. */
  now?: () => Date;
}

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
  fatal(msg: string, fields?: Record<string, unknown>): void;
  /** Derived logger with extra bindings (request/tenant context). */
  child(bindings: Record<string, unknown>): Logger;
}

/** Default sink — one JSON line on stdout (console.error for ≥ error). */
export const defaultSink: LogSink = (line, record) => {
  const weight = LEVEL_WEIGHT[record.level] ?? 20;
  if (weight >= LEVEL_WEIGHT.error) console.error(line);
  else console.log(line);
};

export function createLogger(options: LoggerOptions): Logger {
  const minWeight = LEVEL_WEIGHT[options.minLevel ?? 'info'];
  const sink = options.sink ?? defaultSink;
  const now = options.now ?? (() => new Date());

  function emit(level: LogLevel, msg: string, fields: Record<string, unknown> | undefined, bindings: Record<string, unknown>): void {
    if (LEVEL_WEIGHT[level] < minWeight) return;

    // Deep-redact caller-supplied content — callers can never bypass PII
    // protection. Structural fields (time/level/service) are generated
    // here and never redacted (timestamps must stay intact).
    const payload = redactValue({ ...bindings, ...(fields ?? {}) }) as Record<string, unknown>;
    const record = {
      time: now().toISOString(),
      level,
      msg: redactText(msg),
      service: options.service,
      ...payload,
    } as LogRecord;

    let line: string;
    try {
      line = JSON.stringify(record);
    } catch {
      line = JSON.stringify({ time: record.time, level, msg, service: options.service, error: 'unserializable-fields' });
    }
    sink(line, record);
  }

  function make(bindings: Record<string, unknown>): Logger {
    return {
      debug: (msg, fields) => emit('debug', msg, fields, bindings),
      info: (msg, fields) => emit('info', msg, fields, bindings),
      warn: (msg, fields) => emit('warn', msg, fields, bindings),
      error: (msg, fields) => emit('error', msg, fields, bindings),
      fatal: (msg, fields) => emit('fatal', msg, fields, bindings),
      child: (extra) => make({ ...bindings, ...extra }),
    };
  }

  return make(options.bindings ?? {});
}

/** Resolve the production-safe minimum level from the environment. */
export function levelFromEnv(env: { NODE_ENV?: string; LOG_LEVEL?: string }): LogLevel {
  const explicit = env.LOG_LEVEL as LogLevel | undefined;
  if (explicit && explicit in LEVEL_WEIGHT) return explicit;
  // RULE: never debug in production.
  return env.NODE_ENV === 'production' ? 'info' : 'debug';
}

// =============================================================================
// Client-side batching (TASK 1: batch logs, flush on error)
// =============================================================================

export interface BatchedSinkOptions {
  /** Max records buffered before a forced flush. */
  maxSize?: number;
  /** Flush interval in ms. */
  flushMs?: number;
  /** Delivery callback — receives the flushed records. */
  transport: (records: LogRecord[]) => void | Promise<void>;
}

/**
 * Batching wrapper for client emission: buffers records, flushes on a
 * timer, on buffer-full and on demand (`flush()` — wired to error/unload
 * so diagnostics are never lost when it matters).
 */
export function createBatchingSink(options: BatchedSinkOptions) {
  const maxSize = options.maxSize ?? 20;
  const buffer: LogRecord[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;

  async function flush(): Promise<void> {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0, buffer.length);
    try {
      await options.transport(batch);
    } catch {
      // Telemetry must never crash the app; drop the batch.
    }
  }

  const sink: LogSink = (_line, record) => {
    buffer.push(record);
    // Errors flush immediately — diagnostics for failures are urgent.
    if (record.level === 'error' || record.level === 'fatal') {
      void flush();
      return;
    }
    if (buffer.length >= maxSize) void flush();
  };

  function start(): void {
    if (timer === null) timer = setInterval(() => void flush(), options.flushMs ?? 30_000);
  }
  function stop(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  return { sink, flush, start, stop, bufferSize: () => buffer.length };
}
