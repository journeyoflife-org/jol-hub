/**
 * @jol-hub/observability — STEP 16 core (pure logic, zero deps).
 *
 *   redact          PII/secret redaction (GDPR Art. 5) — applied to EVERY log
 *   logger          structured JSON-lines logger + client batching sink
 *   error-tracking  categorize / fingerprint / severity / breadcrumbs
 *   performance     navigation phases, slow resources, metric batching
 *   health          dependency aggregation + timeout probes
 *
 * Bindings live in template-renderer (`src/lib/logger.ts`,
 * `src/lib/error-tracking.ts`, `/api/health`, `/api/telemetry/errors`).
 */
export {
  REDACTED,
  isSensitiveKey,
  redactText,
  redactValue,
} from './redact';
export {
  createLogger,
  createBatchingSink,
  defaultSink,
  levelFromEnv,
  type Logger,
  type LogLevel,
  type LogRecord,
  type LogSink,
  type LoggerOptions,
  type BatchedSinkOptions,
} from './logger';
export {
  categorizeError,
  assessSeverity,
  fingerprintError,
  classifyError,
  createBreadcrumbBuffer,
  type ErrorCategory,
  type ErrorSeverity,
  type ClassifiedError,
  type ErrorContext,
  type Breadcrumb,
  type BreadcrumbType,
} from './error-tracking';
export {
  computeNavigationPhases,
  slowestResources,
  createMetricBatcher,
  type NavigationPhaseTimings,
  type ResourceSummary,
  type ApiLatencySample,
  type MetricBatcherOptions,
} from './performance';
export {
  aggregateHealth,
  withTimeout,
  timed,
  type DependencyStatus,
  type DependencyCheck,
  type HealthReport,
} from './health';
