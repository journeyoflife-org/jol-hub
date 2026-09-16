# Compliance Audit Logging

<cite>
**Referenced Files in This Document**
- [audit.py](file://data/src/audit.py)
- [audit_logger.py](file://backend/django/apps/crm/audit_logger.py)
- [models.py](file://backend/django/apps/core/models.py)
- [gdpr_compliance.sql](file://data/sql/audit_queries/gdpr_compliance.sql)
- [gdpr_compliance_report.sql](file://data/dbt/models/marts/gdpr_compliance_report.sql)
- [retention_manager.py](file://data/src/gdpr/retention_manager.py)
- [001_initial_schema.sql](file://data/sql/schema_setup/001_initial_schema.sql)
- [check_compliance.py](file://backend/django/apps/crm/management/commands/check_compliance.py)
- [security-model.md](file://docs/architecture/security-model.md)
- [GDPR-checklist.md](file://docs/compliance/GDPR-checklist.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains how the system implements GDPR-compliant audit logging to demonstrate accountability under Article 5(2). It covers:
- How all data processing activities are logged with timestamps, user attribution, and purpose specification
- SQL queries for compliance reporting, audit trail analysis, and regulatory inspection preparation
- Examples of generating compliance reports, investigating data breaches, and maintaining audit integrity
- Log retention policies, access controls, and tamper-evident logging mechanisms

The design ensures that every meaningful action is recorded with sufficient detail to support audits, inspections, and incident investigations while enforcing legal basis tracking, consent management, and retention rules.

## Project Structure
Audit logging spans multiple layers:
- Data layer: immutable log model and schema with indexes and row-level security
- Application layer: Django-based CRM audit logger capturing context, field changes, and legal basis
- Processing layer: file-based append-only JSONL logs with hash chains and HMAC signatures
- Analytics layer: dbt models and SQL queries for compliance reporting and retention status
- Retention and legal hold: automated cleanup with legal hold checks and approval gates

```mermaid
graph TB
subgraph "Application Layer"
A["CRM Audit Logger"]
B["Core AuditLog Model"]
end
subgraph "Processing Layer"
C["File-based Audit Logger<br/>JSONL + Hash Chain + HMAC"]
end
subgraph "Data Layer"
D["PostgreSQL Audit Tables<br/>Indexes + RLS"]
end
subgraph "Analytics Layer"
E["SQL Queries"]
F["dbt Mart: GDPR Report"]
end
subgraph "Retention & Legal Hold"
G["Retention Manager"]
H["Legal Hold Registry"]
end
A --> B
A --> C
B --> D
C --> D
D --> E
D --> F
G --> C
G --> H
```

**Diagram sources**
- [audit_logger.py:154-274](file://backend/django/apps/crm/audit_logger.py#L154-L274)
- [models.py:67-200](file://backend/django/apps/core/models.py#L67-L200)
- [audit.py:205-369](file://data/src/audit.py#L205-L369)
- [gdpr_compliance_report.sql:10-67](file://data/dbt/models/marts/gdpr_compliance_report.sql#L10-L67)
- [retention_manager.py:188-265](file://data/src/gdpr/retention_manager.py#L188-L265)

**Section sources**
- [audit_logger.py:154-274](file://backend/django/apps/crm/audit_logger.py#L154-L274)
- [models.py:67-200](file://backend/django/apps/core/models.py#L67-L200)
- [audit.py:205-369](file://data/src/audit.py#L205-L369)
- [gdpr_compliance_report.sql:10-67](file://data/dbt/models/marts/gdpr_compliance_report.sql#L10-L67)
- [retention_manager.py:188-265](file://data/src/gdpr/retention_manager.py#L188-L265)

## Core Components
- File-based tamper-evident audit logger:
  - Append-only JSONL files per day
  - Hash chain linking each event to the previous
  - HMAC signature using a secret key for tamper detection
  - Sequence numbers for ordering verification
  - Querying and verification utilities for compliance and forensics
- Django CRM audit logger:
  - Captures request context (user, IP, user agent, tenant)
  - Records field-level changes and data classification
  - Tracks GDPR legal basis automatically based on fields and consent
  - Logs financial transactions and consent changes
  - Integrates with external systems via structured logging
- Core audit log model:
  - Immutable audit trail with checksums
  - Tenant isolation enforcement at save time
  - Indexed fields for efficient querying by entity, user, organization, and subject
- Retention manager and legal holds:
  - Configurable retention rules per data type
  - Legal hold registry preventing deletion when active
  - Automated cleanup with dry-run and audit logging

**Section sources**
- [audit.py:29-203](file://data/src/audit.py#L29-L203)
- [audit.py:205-369](file://data/src/audit.py#L205-L369)
- [audit_logger.py:97-181](file://backend/django/apps/crm/audit_logger.py#L97-L181)
- [audit_logger.py:218-447](file://backend/django/apps/crm/audit_logger.py#L218-L447)
- [models.py:67-200](file://backend/django/apps/core/models.py#L67-L200)
- [retention_manager.py:78-106](file://data/src/gdpr/retention_manager.py#L78-L106)
- [retention_manager.py:109-185](file://data/src/gdpr/retention_manager.py#L109-L185)
- [retention_manager.py:188-265](file://data/src/gdpr/retention_manager.py#L188-L265)

## Architecture Overview
The system uses a layered approach to ensure comprehensive, tamper-evident audit logging:
- Application layer captures rich context and enforces legal basis and classification
- Processing layer persists events immutably with cryptographic integrity
- Data layer stores normalized records with strong indexing and row-level security
- Analytics layer provides standardized reporting and retention metrics
- Retention and legal hold subsystem enforce storage limitation and prevent unlawful erasure

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Django API"
participant CRM as "CRM Audit Logger"
participant DB as "AuditLog Model"
participant Proc as "File-based Audit Logger"
participant Ret as "Retention Manager"
Client->>API : "Request (e.g., update contact)"
API->>CRM : "log_update(instance, context, details)"
CRM->>DB : "Create AuditEntry (checksum, tenant validation)"
CRM->>Proc : "log(AuditEvent with legal_basis, categories)"
Proc-->>Proc : "Seal event (hash chain + HMAC)"
Proc-->>DB : "Persist to append-only log files"
Note over Proc,DB : "Integrity preserved across layers"
API->>Ret : "Check legal holds before deletion"
Ret-->>API : "Hold status"
API-->>Client : "Response"
```

**Diagram sources**
- [audit_logger.py:276-347](file://backend/django/apps/crm/audit_logger.py#L276-L347)
- [models.py:156-200](file://backend/django/apps/core/models.py#L156-L200)
- [audit.py:330-369](file://data/src/audit.py#L330-L369)
- [retention_manager.py:206-246](file://data/src/gdpr/retention_manager.py#L206-L246)

## Detailed Component Analysis

### Tamper-Evident File-Based Audit Logger
- Event structure includes action, resource type, timestamp, actor, metadata, legal basis, data categories, retention period, sequence number, previous hash, event hash, and signature
- Each event is sealed with a hash chain and HMAC signature; any modification breaks the chain or invalidates the signature
- Daily rotation keeps logs manageable; query methods filter by date range, action, resource type, and actor
- Verification routines check chain continuity, sequence monotonicity, event hash consistency, and HMAC validity

```mermaid
flowchart TD
Start(["Start log(event)"]) --> Seal["Seal event:<br/>prev_hash, sequence_number, compute_hash(), compute_signature()"]
Seal --> UpdateState["Update chain state:<br/>last_hash, last_sequence"]
UpdateState --> Write["Append to daily JSONL file"]
Write --> Persist["Persist chain state"]
Persist --> End(["Return event_id"])
```

**Diagram sources**
- [audit.py:330-369](file://data/src/audit.py#L330-L369)
- [audit.py:134-203](file://data/src/audit.py#L134-L203)

**Section sources**
- [audit.py:29-203](file://data/src/audit.py#L29-L203)
- [audit.py:205-369](file://data/src/audit.py#L205-L369)
- [audit.py:409-589](file://data/src/audit.py#L409-L589)

### Django CRM Audit Logger
- Captures request context (user ID, email, IP, user agent, tenant, request ID)
- Records field-level changes with data classification and flags for PII and special category data
- Determines GDPR legal basis automatically based on instance attributes and field changes
- Logs creation, updates, deletions, access, financial transactions, consent changes, and unauthorized access attempts
- Integrates with external systems via structured logging for SIEM ingestion

```mermaid
classDiagram
class ComplianceAuditLogger {
+log_create(instance, context, details, legal_basis)
+log_update(instance, field_changes, context, details, legal_basis)
+log_delete(instance, context, details, legal_basis)
+log_access(instance, context, access_type, details)
+log_financial_transaction(transaction_type, instance, amount, currency, context, details)
+log_consent_change(instance, old_status, new_status, context, details)
+log_gdpr_request(request_type, data_subject_id, organization_id, context, details)
+log_unauthorized_access(entity_type, entity_id, context, reason, details)
}
class AuditContext {
+user_id
+user_email
+ip_address
+user_agent
+tenant_id
+request_id
+from_request(request)
}
class FieldChange {
+field_name
+old_value
+new_value
+data_classification
+to_dict()
}
ComplianceAuditLogger --> AuditContext : "uses"
ComplianceAuditLogger --> FieldChange : "records"
```

**Diagram sources**
- [audit_logger.py:97-181](file://backend/django/apps/crm/audit_logger.py#L97-L181)
- [audit_logger.py:218-447](file://backend/django/apps/crm/audit_logger.py#L218-L447)

**Section sources**
- [audit_logger.py:97-181](file://backend/django/apps/crm/audit_logger.py#L97-L181)
- [audit_logger.py:218-447](file://backend/django/apps/crm/audit_logger.py#L218-L447)
- [audit_logger.py:449-629](file://backend/django/apps/crm/audit_logger.py#L449-L629)

### Core Audit Log Model and Schema
- Immutable audit trail with checksum generation at save time
- Tenant isolation enforced during save to prevent cross-tenant writes
- Indexes optimize queries by entity, user, organization, and data subject
- Row-level security enabled for multi-tenant access control
- Additional tables include processing activities registry and retention records with indexes for compliance queries

```mermaid
erDiagram
AUDIT_LOG {
uuid id PK
uuid user_id
varchar action
varchar entity_type
varchar entity_id
jsonb field_changes
inet ip_address
text user_agent
uuid correlation_id
uuid organization_id
varchar consent_reference
varchar legal_basis
varchar data_subject_id
varchar checksum
jsonb extra
timestamp created_at
timestamp updated_at
}
PROCESSING_ACTIVITIES {
varchar id PK
varchar name
text purpose
varchar legal_basis
text[] data_categories
text[] data_subjects
text[] recipients
int retention_days
text[] security_measures
boolean sensitive_data
timestamp created_at
timestamp updated_at
}
RETENTION_RECORDS {
uuid id PK
varchar data_type
timestamp expires_at
timestamp deleted_at
boolean legal_hold
}
AUDIT_LOG ||--o{ PROCESSING_ACTIVITIES : "references purpose/legal_basis"
AUDIT_LOG ||--o{ RETENTION_RECORDS : "subject to retention rules"
```

**Diagram sources**
- [models.py:67-200](file://backend/django/apps/core/models.py#L67-L200)
- [001_initial_schema.sql:45-74](file://data/sql/schema_setup/001_initial_schema.sql#L45-L74)

**Section sources**
- [models.py:67-200](file://backend/django/apps/core/models.py#L67-L200)
- [001_initial_schema.sql:45-74](file://data/sql/schema_setup/001_initial_schema.sql#L45-L74)

### Retention Management and Legal Holds
- Retention rules define data types, retention periods, legal basis, and approval requirements
- Legal hold registry prevents deletion when active holds exist (litigation, investigation, audit, subpoena, law enforcement)
- Deletion operations check legal holds first and log actions for auditability
- Dry-run mode supports planning and verification without affecting data

```mermaid
flowchart TD
Start(["Delete expired(data_type)"]) --> GetRule["Lookup retention rule"]
GetRule --> Cutoff["Compute cutoff date"]
Cutoff --> CheckHolds["Get subjects with legal holds"]
CheckHolds --> DryRun{"Dry run?"}
DryRun --> |Yes| Report["Report stats and skipped reasons"]
DryRun --> |No| Delete["Delete records past cutoff<br/>excluding legal holds"]
Delete --> Audit["Log retention cleanup"]
Report --> End(["Exit"])
Audit --> End
```

**Diagram sources**
- [retention_manager.py:78-106](file://data/src/gdpr/retention_manager.py#L78-L106)
- [retention_manager.py:109-185](file://data/src/gdpr/retention_manager.py#L109-L185)
- [retention_manager.py:206-265](file://data/src/gdpr/retention_manager.py#L206-L265)

**Section sources**
- [retention_manager.py:78-106](file://data/src/gdpr/retention_manager.py#L78-L106)
- [retention_manager.py:109-185](file://data/src/gdpr/retention_manager.py#L109-L185)
- [retention_manager.py:188-265](file://data/src/gdpr/retention_manager.py#L188-L265)

### Compliance Reporting and SQL Queries
- SQL queries provide:
  - All processing activities for a data subject (Article 15)
  - Retention compliance status (overdue, deleted, on hold)
  - GDPR request status summary with average completion times
  - Audit log activity by day for trend analysis
  - Consent status aggregation for subjects with invalid or expired consents
- dbt mart aggregates processing activities and calculates approaching retention expiry alerts

```mermaid
graph LR
Q1["Subject Activities (Art. 15)"] --> R["Compliance Reports"]
Q2["Retention Status"] --> R
Q3["GDPR Request Summary"] --> R
Q4["Daily Activity Trends"] --> R
Q5["Consent Status"] --> R
M["dbt Mart: GDPR Report"] --> R
```

**Diagram sources**
- [gdpr_compliance.sql:4-66](file://data/sql/audit_queries/gdpr_compliance.sql#L4-L66)
- [gdpr_compliance_report.sql:10-67](file://data/dbt/models/marts/gdpr_compliance_report.sql#L10-L67)

**Section sources**
- [gdpr_compliance.sql:4-66](file://data/sql/audit_queries/gdpr_compliance.sql#L4-L66)
- [gdpr_compliance_report.sql:10-67](file://data/dbt/models/marts/gdpr_compliance_report.sql#L10-L67)

## Dependency Analysis
- The Django CRM audit logger depends on:
  - Django models for persistence and tenant validation
  - Structured logging for external SIEM integration
  - Optional external systems for additional observability
- The file-based audit logger depends on:
  - Environment configuration for log directory and secret key
  - Append-only filesystem semantics for integrity
- Retention manager depends on:
  - Audit logger for recording cleanup actions
  - Legal hold registry to block deletions
- Analytics depend on:
  - Database indexes for performance
  - dbt transformations for consistent reporting

```mermaid
graph TB
CRM["CRM Audit Logger"] --> Models["Core AuditLog Model"]
CRM --> FileLogger["File-based Audit Logger"]
FileLogger --> FS["Append-only Filesystem"]
Models --> DB["PostgreSQL"]
Ret["Retention Manager"] --> LH["Legal Hold Registry"]
Ret --> FileLogger
DB --> SQL["SQL Queries"]
DB --> DBT["dbt Mart"]
```

**Diagram sources**
- [audit_logger.py:218-447](file://backend/django/apps/crm/audit_logger.py#L218-L447)
- [models.py:67-200](file://backend/django/apps/core/models.py#L67-L200)
- [audit.py:205-369](file://data/src/audit.py#L205-L369)
- [retention_manager.py:188-265](file://data/src/gdpr/retention_manager.py#L188-L265)

**Section sources**
- [audit_logger.py:218-447](file://backend/django/apps/crm/audit_logger.py#L218-L447)
- [models.py:67-200](file://backend/django/apps/core/models.py#L67-L200)
- [audit.py:205-369](file://data/src/audit.py#L205-L369)
- [retention_manager.py:188-265](file://data/src/gdpr/retention_manager.py#L188-L265)

## Performance Considerations
- Use database indexes on frequently queried fields (entity_type, entity_id, user_id, organization_id, data_subject_id) to speed up compliance queries
- Partition audit logs by month or quarter to improve retention cleanup and query performance
- Keep append-only log files small via daily rotation; archive older files to cold storage
- Avoid logging sensitive fields; mask or redact where necessary
- Batch analytics jobs during off-peak hours to minimize impact on production

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Audit log integrity compromised:
  - Run chain verification to detect broken links, sequence gaps, hash mismatches, or invalid signatures
  - Investigate environment changes or unauthorized access to log directories
  - Restore from verified backups if chain is broken
- Missing or inconsistent legal basis:
  - Ensure CRM audit logger determines legal basis based on instance attributes and field changes
  - Validate consent status and special category data handling
- Retention cleanup failures:
  - Check legal holds before deletion; use dry-run to plan
  - Verify retention rules and cutoff dates
- Cross-tenant audit log attempts:
  - Review tenant validation logic and middleware context
  - Ensure organization_id matches current tenant context

**Section sources**
- [audit.py:513-589](file://data/src/audit.py#L513-L589)
- [models.py:156-200](file://backend/django/apps/core/models.py#L156-L200)
- [retention_manager.py:206-265](file://data/src/gdpr/retention_manager.py#L206-L265)
- [check_compliance.py:125-158](file://backend/django/apps/crm/management/commands/check_compliance.py#L125-L158)

## Conclusion
The system implements robust, GDPR-compliant audit logging through:
- Comprehensive capture of processing activities with timestamps, user attribution, and purpose specification
- Tamper-evident mechanisms including hash chains and HMAC signatures
- Strong retention policies with legal hold protections
- Standardized SQL and dbt reporting for compliance and regulatory inspection
- Access controls and tenant isolation to maintain data boundaries

These components collectively support accountability under Article 5(2), facilitate breach investigations, and enable reliable compliance reporting.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Example Workflows

#### Generating a Compliance Report
- Use dbt mart to aggregate processing activities and calculate retention proximity alerts
- Combine with SQL queries for subject activities, retention status, and GDPR request summaries
- Schedule regular report generation and distribute to compliance officers

**Section sources**
- [gdpr_compliance_report.sql:10-67](file://data/dbt/models/marts/gdpr_compliance_report.sql#L10-L67)
- [gdpr_compliance.sql:4-66](file://data/sql/audit_queries/gdpr_compliance.sql#L4-L66)

#### Investigating a Data Breach
- Retrieve all audit entries for affected entities and users within the incident timeframe
- Verify chain integrity to ensure evidence has not been tampered with
- Correlate access logs, financial transactions, and consent changes
- Preserve snapshots and network captures per incident response procedures

**Section sources**
- [security-model.md:350-400](file://docs/architecture/security-model.md#L350-L400)
- [audit.py:409-589](file://data/src/audit.py#L409-L589)

#### Maintaining Audit Integrity
- Regularly verify chain integrity and HMAC signatures
- Monitor sequence numbers for gaps or reorderings
- Protect secret keys and restrict access to log directories
- Enforce append-only storage and immutable backups

**Section sources**
- [audit.py:134-203](file://data/src/audit.py#L134-L203)
- [audit.py:513-589](file://data/src/audit.py#L513-L589)