# Analytics & Reporting Services

<cite>
**Referenced Files in This Document**
- [models.py](file://backend/django/apps/analytics/models.py)
- [views.py](file://backend/django/apps/analytics/views.py)
- [serializers.py](file://backend/django/apps/analytics/serializers.py)
- [urls.py](file://backend/django/apps/analytics/urls.py)
- [daily_aggregation.py](file://data/src/pipelines/donation_analytics/daily_aggregation.py)
- [anonymizer.py](file://data/src/gdpr/anonymizer.py)
- [metrics_endpoint.py](file://backend/django/apps/core/metrics_endpoint.py)
- [metrics.py](file://backend/django/apps/crm/observability/metrics.py)
- [jol_weekly_reporting.py](file://data/airflow/dags/jol_weekly_reporting.py)
- [mart_country_metrics.sql](file://data/src/transformations/marts/mart_country_metrics.sql)
- [api.ts](file://frontend/apps/admin-dashboard/src/lib/api.ts)
- [analytics page](file://frontend/apps/admin-dashboard/src/app/(dashboard)/analytics/page.tsx)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion
10. Appendices

## Introduction
This document describes the Analytics and Reporting services that collect, aggregate, and expose metrics for dashboards and business intelligence. It covers:
- Metrics collection (page views, donations, performance)
- Dashboard APIs for overview, daily stats, and top parishes with privacy safeguards
- Report generation via Airflow DAGs and dbt transformations
- Data aggregation pipelines with k-anonymity and consent enforcement
- Real-time analytics ingestion points and historical analysis
- Custom metric definitions and export capabilities
- Performance monitoring, user behavior tracking, conversion funnel concepts, and BI integration guidance

## Project Structure
The analytics stack spans backend Django APIs, data pipelines, scheduled reporting, and a frontend dashboard client.

```mermaid
graph TB
subgraph "Frontend"
FE_API["Admin Dashboard API Client<br/>api.ts"]
FE_PAGE["Analytics Page<br/>analytics/page.tsx"]
end
subgraph "Backend"
ANA_URLS["Analytics URLs<br/>urls.py"]
ANA_VIEWS["Analytics Views<br/>views.py"]
ANA_MODELS["Models<br/>models.py"]
METRICS_EP["Prometheus /metrics<br/>metrics_endpoint.py"]
CRM_METRICS["CRM Observability Metrics<br/>metrics.py"]
end
subgraph "Data & Reporting"
PIPELINE["Donation Aggregation Pipeline<br/>daily_aggregation.py"]
ANON["K-Anonymizer<br/>anonymizer.py"]
AIRFLOW["Weekly Reporting DAG<br/>jol_weekly_reporting.py"]
DBT_MART["Country Metrics Mart<br/>mart_country_metrics.sql"]
end
FE_API --> ANA_URLS
FE_PAGE --> FE_API
ANA_URLS --> ANA_VIEWS
ANA_VIEWS --> ANA_MODELS
ANA_VIEWS --> CRM_METRICS
PIPELINE --> ANON
AIRFLOW --> PIPELINE
AIRFLOW --> DBT_MART
METRICS_EP --> CRM_METRICS
```

**Diagram sources**
- [urls.py:6-10](file://backend/django/apps/analytics/urls.py#L6-L10)
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [models.py:12-174](file://backend/django/apps/analytics/models.py#L12-L174)
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)
- [metrics.py:47-123](file://backend/django/apps/crm/observability/metrics.py#L47-L123)
- [daily_aggregation.py:62-242](file://data/src/pipelines/donation_analytics/daily_aggregation.py#L62-L242)
- [anonymizer.py:106-180](file://data/src/gdpr/anonymizer.py#L106-L180)
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [mart_country_metrics.sql:1-96](file://data/src/transformations/marts/mart_country_metrics.sql#L1-L96)
- [api.ts:309-337](file://frontend/apps/admin-dashboard/src/lib/api.ts#L309-L337)

**Section sources**
- [urls.py:6-10](file://backend/django/apps/analytics/urls.py#L6-L10)
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [models.py:12-174](file://backend/django/apps/analytics/models.py#L12-L174)
- [daily_aggregation.py:62-242](file://data/src/pipelines/donation_analytics/daily_aggregation.py#L62-L242)
- [anonymizer.py:106-180](file://data/src/gdpr/anonymizer.py#L106-L180)
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)
- [metrics.py:47-123](file://backend/django/apps/crm/observability/metrics.py#L47-L123)
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [mart_country_metrics.sql:1-96](file://data/src/transformations/marts/mart_country_metrics.sql#L1-L96)
- [api.ts:309-337](file://frontend/apps/admin-dashboard/src/lib/api.ts#L309-L337)

## Core Components
- Models: Raw page-view events and pre-aggregated daily statistics with tenant isolation and consent fields.
- Views: Secure, consent-gated APIs for overview, daily stats, and top parishes with k-anonymity.
- Serializers: Typed responses for aggregated analytics and top-parish results.
- Pipelines: Donation aggregation pipeline producing anonymized metrics and trends.
- Anonymization: K-anonymity with country-specific thresholds and count rounding.
- Monitoring: Prometheus metrics endpoint and observability counters/histograms.
- Scheduling: Airflow weekly reporting DAG orchestrating analytics and compliance outputs.
- Transformations: dbt marts generating country-level metrics with k-anonymity constraints.
- Frontend: Admin dashboard client calling analytics endpoints and exporting reports.

**Section sources**
- [models.py:12-174](file://backend/django/apps/analytics/models.py#L12-L174)
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [serializers.py:10-70](file://backend/django/apps/analytics/serializers.py#L10-L70)
- [daily_aggregation.py:62-242](file://data/src/pipelines/donation_analytics/daily_aggregation.py#L62-L242)
- [anonymizer.py:106-180](file://data/src/gdpr/anonymizer.py#L106-L180)
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)
- [metrics.py:47-123](file://backend/django/apps/crm/observability/metrics.py#L47-L123)
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [mart_country_metrics.sql:1-96](file://data/src/transformations/marts/mart_country_metrics.sql#L1-L96)
- [api.ts:309-337](file://frontend/apps/admin-dashboard/src/lib/api.ts#L309-L337)

## Architecture Overview
The system collects raw page-view events and donation data, enforces consent and privacy, aggregates into daily stats and marts, and exposes secure APIs for dashboards. Scheduled jobs produce weekly reports and compliance scorecards.

```mermaid
sequenceDiagram
participant FE as "Admin Dashboard"
participant API as "Analytics API"
participant DB as "Django Models"
participant MON as "Observability Metrics"
participant DAG as "Airflow Weekly DAG"
participant Marts as "dbt Country Mart"
FE->>API : GET /analytics/overview?organization_id&start_date&end_date
API->>DB : Filter DailyStats by org and date range
DB-->>API : Aggregated totals
API-->>FE : Overview response (consent-gated)
FE->>API : GET /analytics/top-parishes?metric&limit
API->>DB : Aggregate by organization with consent filter
API->>API : Apply k-anonymity rounding and grouping
API-->>FE : Top parishes (anonymized)
DAG->>DAG : Run weekly tasks
DAG->>Marts : Generate country metrics (k-anonymized)
Marts-->>DAG : Aggregated country report
API->>MON : Record request and latency metrics
```

**Diagram sources**
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [models.py:107-174](file://backend/django/apps/analytics/models.py#L107-L174)
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [mart_country_metrics.sql:1-96](file://data/src/transformations/marts/mart_country_metrics.sql#L1-L96)
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)

## Detailed Component Analysis

### Analytics Models: Raw Events and Daily Stats
- PageView captures per-session page interactions with consent flags and anonymized IP handling.
- DailyStats stores pre-aggregated metrics per organization per day, including donations and engagement.
- Both models enforce tenant context validation to prevent cross-tenant manipulation.

```mermaid
classDiagram
class PageView {
+UUID id
+Organization organization
+string page_path
+string referrer
+string user_agent
+GenericIPAddress ip_address
+string session_id
+string country_code
+string language
+enum device_type
+int duration_seconds
+bool consent_given
+string consent_version
+save()
}
class DailyStats {
+UUID id
+Organization organization
+date date
+int page_views
+int unique_visitors
+int sessions
+decimal bounce_rate
+int avg_session_duration
+int new_visitors
+decimal total_donations
+int donation_count
+save()
}
PageView --> Organization : "FK"
DailyStats --> Organization : "FK"
```

**Diagram sources**
- [models.py:12-105](file://backend/django/apps/analytics/models.py#L12-L105)
- [models.py:107-174](file://backend/django/apps/analytics/models.py#L107-L174)

**Section sources**
- [models.py:12-174](file://backend/django/apps/analytics/models.py#L12-L174)

### Analytics APIs: Consent-Gated Dashboards
- Overview: Aggregates page views, visitors, sessions, bounce rate, session duration, donations, and donation counts within a date range; requires explicit analytics consent.
- Daily Stats: Returns recent daily stats for an organization with consent checks.
- Top Parishes: Aggregates organizations’ metrics with k-anonymity applied; small groups are rounded or grouped into “Other”.

```mermaid
sequenceDiagram
participant Client as "Client"
participant View as "AnalyticsOverviewView"
participant Consent as "ConsentSettings"
participant QS as "DailyStats QuerySet"
Client->>View : GET /analytics/overview
View->>View : Validate params (org_id, dates, range)
View->>Consent : has_analytics_consent(org_id)
Consent-->>View : True/False
alt Consent granted
View->>QS : Filter by org and date range
QS-->>View : Aggregated metrics
View-->>Client : Overview payload
else No consent
View-->>Client : 403 CONSENT_REQUIRED
end
```

**Diagram sources**
- [views.py:173-241](file://backend/django/apps/analytics/views.py#L173-L241)

**Section sources**
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [serializers.py:35-70](file://backend/django/apps/analytics/serializers.py#L35-L70)

### Donation Aggregation Pipeline: K-Anonymized Trends
- Groups donations by country and organization type.
- Enforces minimum donor thresholds before reporting.
- Produces anonymized metrics and trend summaries without individual-level data.

```mermaid
flowchart TD
Start(["Start aggregation"]) --> Group["Group donations by country/org"]
Group --> CheckThreshold{"Unique donors >= min?"}
CheckThreshold -- "No" --> Suppress["Suppress group"]
CheckThreshold -- "Yes" --> Calc["Calculate metrics<br/>total, count, percentiles"]
Calc --> Anon["Anonymize donor count (round to k)"]
Anon --> Trend["Generate trends over N days"]
Suppress --> End(["End"])
Trend --> End
```

**Diagram sources**
- [daily_aggregation.py:82-242](file://data/src/pipelines/donation_analytics/daily_aggregation.py#L82-L242)
- [anonymizer.py:123-126](file://data/src/gdpr/anonymizer.py#L123-L126)

**Section sources**
- [daily_aggregation.py:62-242](file://data/src/pipelines/donation_analytics/daily_aggregation.py#L62-L242)
- [anonymizer.py:106-180](file://data/src/gdpr/anonymizer.py#L106-L180)

### K-Anonymity and Privacy Safeguards
- Country-specific k values with environment override.
- Count rounding to nearest k for privacy.
- Suppression of small groups in aggregations.

```mermaid
flowchart TD
Input["Input records"] --> Config["Resolve k from country/env"]
Config --> Round["Round counts to nearest k"]
Round --> GroupCheck{"Group size < k?"}
GroupCheck -- "Yes" --> Suppress["Suppress or merge into Other"]
GroupCheck -- "No" --> Output["Include anonymized result"]
```

**Diagram sources**
- [anonymizer.py:66-84](file://data/src/gdpr/anonymizer.py#L66-L84)
- [anonymizer.py:123-126](file://data/src/gdpr/anonymizer.py#L123-L126)
- [views.py:392-450](file://backend/django/apps/analytics/views.py#L392-L450)

**Section sources**
- [anonymizer.py:106-180](file://data/src/gdpr/anonymizer.py#L106-L180)
- [views.py:392-450](file://backend/django/apps/analytics/views.py#L392-L450)

### Performance Monitoring and Real-Time Ingestion
- Prometheus metrics endpoint exposes system metrics with IP allowlist and optional bearer token protection.
- CRM observability metrics track request counts, latencies, GDPR requests, security events, audit entries, and sync operations.
- Frontend RUM endpoint accepts Web Vitals payloads for real-time performance insights.

```mermaid
graph TB
FE_RUM["Frontend RUM POST /api/perf"] --> Backend["Backend API"]
Backend --> MetricsEP["/metrics (Prometheus)"]
MetricsEP --> Monitor["Monitoring Stack"]
Backend --> CRM["CRM Observability Counters/Histograms"]
```

**Diagram sources**
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)
- [metrics.py:47-123](file://backend/django/apps/crm/observability/metrics.py#L47-L123)

**Section sources**
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)
- [metrics.py:47-123](file://backend/django/apps/crm/observability/metrics.py#L47-L123)

### Scheduled Reporting and Historical Analysis
- Weekly Airflow DAG runs analytics, country metrics, and compliance scorecard tasks.
- dbt mart generates country-level metrics with k-anonymity constraints and public classification.

```mermaid
sequenceDiagram
participant Scheduler as "Airflow"
participant TaskA as "Weekly Analytics"
participant TaskB as "Country Metrics"
participant TaskC as "Compliance Scorecard"
participant DBT as "dbt Mart"
Scheduler->>TaskA : Execute weekly analytics
Scheduler->>TaskB : Generate country metrics
TaskB->>DBT : Build country mart (k-anonymized)
DBT-->>TaskB : Country report
Scheduler->>TaskC : Generate compliance scorecard
```

**Diagram sources**
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [mart_country_metrics.sql:1-96](file://data/src/transformations/marts/mart_country_metrics.sql#L1-L96)

**Section sources**
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [mart_country_metrics.sql:1-96](file://data/src/transformations/marts/mart_country_metrics.sql#L1-L96)

### Frontend Integration and Export Capabilities
- Admin dashboard client calls analytics endpoints for overview, top parishes, country breakdown, and exports.
- Export function supports multiple formats via a dedicated endpoint.

```mermaid
sequenceDiagram
participant UI as "Analytics Page"
participant Client as "api.ts"
participant API as "Backend Analytics"
UI->>Client : getOverview(period)
Client->>API : GET /admin/analytics/overview?period=...
API-->>Client : Overview data
Client-->>UI : Render charts
UI->>Client : getTopParishes(metric, limit)
Client->>API : GET /admin/analytics/top-parishes?...
API-->>Client : Anonymized top parishes
Client-->>UI : Render table
UI->>Client : exportReport(type, filters)
Client->>API : POST /admin/analytics/export/
API-->>Client : downloadUrl
Client-->>UI : Trigger download
```

**Diagram sources**
- [api.ts:309-337](file://frontend/apps/admin-dashboard/src/lib/api.ts#L309-L337)
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)

**Section sources**
- [api.ts:309-337](file://frontend/apps/admin-dashboard/src/lib/api.ts#L309-L337)
- [analytics page:68-113](file://frontend/apps/admin-dashboard/src/app/(dashboard)/analytics/page.tsx#L68-L113)

## Dependency Analysis
- The analytics API depends on models for storage and consent settings for access control.
- Pipelines depend on anonymization utilities and audit logging.
- Reporting DAG depends on pipeline functions and dbt marts.
- Monitoring integrates with Prometheus and CRM observability metrics.

```mermaid
graph LR
Views["Analytics Views"] --> Models["Models"]
Views --> Consent["ConsentSettings"]
Views --> Audit["AuditLog"]
Pipeline["Aggregation Pipeline"] --> Anonymizer["KAnonymizer"]
Pipeline --> AuditLogger["AuditLogger"]
DAG["Airflow DAG"] --> Pipeline
DAG --> Mart["dbt Country Mart"]
MetricsEP["Prometheus Endpoint"] --> CRM["CRM Metrics"]
```

**Diagram sources**
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [models.py:12-174](file://backend/django/apps/analytics/models.py#L12-L174)
- [daily_aggregation.py:62-242](file://data/src/pipelines/donation_analytics/daily_aggregation.py#L62-L242)
- [anonymizer.py:106-180](file://data/src/gdpr/anonymizer.py#L106-L180)
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)
- [metrics.py:47-123](file://backend/django/apps/crm/observability/metrics.py#L47-L123)

**Section sources**
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [models.py:12-174](file://backend/django/apps/analytics/models.py#L12-L174)
- [daily_aggregation.py:62-242](file://data/src/pipelines/donation_analytics/daily_aggregation.py#L62-L242)
- [anonymizer.py:106-180](file://data/src/gdpr/anonymizer.py#L106-L180)
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)
- [metrics.py:47-123](file://backend/django/apps/crm/observability/metrics.py#L47-L123)

## Performance Considerations
- Use database indexes on organization and created_at for efficient time-range queries.
- Limit date ranges to prevent heavy aggregation; enforce maximum range in APIs.
- Apply k-anonymity at source in pipelines to avoid downstream re-computation.
- Cache frequently accessed aggregated results if needed.
- Monitor query performance via Prometheus histograms and logs.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Consent required errors: Ensure organization has analytics consent enabled; check consent settings and configuration.
- Validation errors: Verify parameter formats (UUIDs, ISO dates) and value bounds.
- Access denied on metrics: Confirm IP allowlist and bearer token configuration for the Prometheus endpoint.
- Small group suppression: Adjust k thresholds or groupings if too many results are suppressed.

**Section sources**
- [views.py:33-116](file://backend/django/apps/analytics/views.py#L33-L116)
- [views.py:141-170](file://backend/django/apps/analytics/views.py#L141-L170)
- [metrics_endpoint.py:95-129](file://backend/django/apps/core/metrics_endpoint.py#L95-L129)

## Conclusion
The Analytics & Reporting services provide a robust, privacy-first foundation for collecting, aggregating, and exposing metrics across dashboards and BI tools. Consent gating, k-anonymity, and scheduled reporting ensure compliance and reliability. The modular design enables extension for custom metrics, additional export formats, and deeper integrations.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### API Reference Summary
- Overview: Aggregated metrics for a date range with consent status.
- Daily Stats: Recent daily statistics per organization.
- Top Parishes: Ranked organizations with k-anonymity applied.
- Export: Downloadable reports in multiple formats.

**Section sources**
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [api.ts:309-337](file://frontend/apps/admin-dashboard/src/lib/api.ts#L309-L337)

### Creating Custom Reports
- Define new aggregation logic in the pipeline or dbt model.
- Add corresponding API endpoints under analytics views and serializers.
- Schedule periodic generation via Airflow DAGs.
- Expose export functionality through the admin dashboard client.

**Section sources**
- [daily_aggregation.py:82-242](file://data/src/pipelines/donation_analytics/daily_aggregation.py#L82-L242)
- [mart_country_metrics.sql:1-96](file://data/src/transformations/marts/mart_country_metrics.sql#L1-L96)
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)
- [api.ts:309-337](file://frontend/apps/admin-dashboard/src/lib/api.ts#L309-L337)

### Integrating with BI Tools
- Use the analytics APIs to feed dashboards with aggregated, consented data.
- Leverage the Prometheus /metrics endpoint for system health and performance indicators.
- Pull country metrics marts for regional insights in BI platforms.

**Section sources**
- [views.py:173-458](file://backend/django/apps/analytics/views.py#L173-L458)
- [metrics_endpoint.py:68-154](file://backend/django/apps/core/metrics_endpoint.py#L68-L154)
- [mart_country_metrics.sql:1-96](file://data/src/transformations/marts/mart_country_metrics.sql#L1-L96)

### Setting Up Automated Reporting Schedules
- Configure Airflow DAGs to run weekly tasks for analytics, country metrics, and compliance.
- Ensure dependencies (pipelines, dbt) are available and credentials are configured.
- Monitor DAG execution and handle retries/failures.

**Section sources**
- [jol_weekly_reporting.py:52-77](file://data/airflow/dags/jol_weekly_reporting.py#L52-L77)

### Optimizing Query Performance for Large Datasets
- Use indexed fields (organization, created_at) for filtering.
- Restrict date ranges and limits in API parameters.
- Pre-aggregate data into DailyStats and marts to reduce runtime computation.
- Monitor and tune queries based on observed load patterns.

**Section sources**
- [models.py:54-62](file://backend/django/apps/analytics/models.py#L54-L62)
- [views.py:101-116](file://backend/django/apps/analytics/views.py#L101-L116)
- [mart_country_metrics.sql:11-41](file://data/src/transformations/marts/mart_country_metrics.sql#L11-L41)