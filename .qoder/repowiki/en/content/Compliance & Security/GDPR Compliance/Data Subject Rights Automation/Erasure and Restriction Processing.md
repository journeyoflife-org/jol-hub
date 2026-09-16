# Erasure and Restriction Processing

<cite>
**Referenced Files in This Document**
- [dsr_service.py](file://backend/django/apps/core/dsr_service.py)
- [data_integration.py](file://backend/django/apps/core/data_integration.py)
- [models.py](file://backend/django/apps/core/models.py)
- [dsar_service.py](file://data/src/dsar_service.py)
- [processors.py](file://data/src/processors.py)
- [retention_manager.py](file://data/src/gdpr/retention_manager.py)
- [anonymizer.py](file://data/src/gdpr/anonymizer.py)
- [jol_gdpr_cleanup.py](file://data/airflow/dags/jol_gdpr_cleanup.py)
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

## Introduction
This document explains the automated erasure and restriction processing capabilities implemented in the JOL-HUB platform to support GDPR Articles 17 (Right to Erasure) and 18 (Right to Restriction of Processing). It covers:
- Automated deletion workflows with soft delete, cascade handling for related data, retention rules, legal holds, and audit trails
- Restriction processing that temporarily suspends data usage while preserving integrity
- Practical DSAR workflow patterns for complex data relationships
- Exception handling for legal retention requirements, public interest, and legitimate interests overrides

The implementation spans a Django backend service layer, a Python-based DSAR orchestration service, retention management, anonymization utilities, and scheduled cleanup via Airflow.

## Project Structure
Key areas involved in erasure and restriction:
- Backend DSR service and integration endpoints
- Data processors for user and donation data
- Retention manager and legal hold registry
- Anonymization utilities for safe export or analysis
- Scheduled DAGs for periodic cleanup

```mermaid
graph TB
subgraph "Backend"
A["DataSubjectRequestService<br/>DSR orchestration"]
B["DataIntegration<br/>Erasure endpoint wrapper"]
C["AuditLog<br/>Immutable audit trail"]
end
subgraph "Data Layer"
D["DSARService<br/>Orchestrates processors"]
E["UserdataProcessor / DonationProcessor<br/>Per-domain deletion"]
F["RetentionManager<br/>Legal holds & retention rules"]
G["KAnonymizer<br/>Anonymization helpers"]
end
subgraph "Automation"
H["Airflow DAG<br/>Scheduled cleanup"]
end
A --> C
B --> F
D --> E
D --> F
H --> F
```

**Diagram sources**
- [dsr_service.py:36-77](file://backend/django/apps/core/dsr_service.py#L36-L77)
- [data_integration.py:307-342](file://backend/django/apps/core/data_integration.py#L307-L342)
- [models.py:67-151](file://backend/django/apps/core/models.py#L67-L151)
- [dsar_service.py:59-86](file://data/src/dsar_service.py#L59-L86)
- [processors.py:668-761](file://data/src/processors.py#L668-L761)
- [retention_manager.py:188-226](file://data/src/gdpr/retention_manager.py#L188-L226)
- [anonymizer.py:106-143](file://data/src/gdpr/anonymizer.py#L106-L143)
- [jol_gdpr_cleanup.py:21-28](file://data/airflow/dags/jol_gdpr_cleanup.py#L21-L28)

**Section sources**
- [dsr_service.py:36-77](file://backend/django/apps/core/dsr_service.py#L36-L77)
- [data_integration.py:307-342](file://backend/django/apps/core/data_integration.py#L307-L342)
- [models.py:67-151](file://backend/django/apps/core/models.py#L67-L151)
- [dsar_service.py:59-86](file://data/src/dsar_service.py#L59-L86)
- [processors.py:668-761](file://data/src/processors.py#L668-L761)
- [retention_manager.py:188-226](file://data/src/gdpr/retention_manager.py#L188-L226)
- [anonymizer.py:106-143](file://data/src/gdpr/anonymizer.py#L106-L143)
- [jol_gdpr_cleanup.py:21-28](file://data/airflow/dags/jol_gdpr_cleanup.py#L21-L28)

## Core Components
- DataSubjectRequestService: Implements DSR lifecycle for Articles 15–22, including erasure and restriction flows with organization-level checks and canonical record handling.
- DSARService: Orchestrates cross-processor access and erasure requests, aggregates results, and maintains audit logs.
- Processors: Domain-specific handlers for retrieving and deleting subject data (e.g., user accounts), enforcing constraints like active memberships.
- RetentionManager and LegalHoldRegistry: Enforce storage limitation and block deletions when legal holds are active; provide pre-checks and reporting.
- KAnonymizer: Provides k-anonymity thresholds and anonymization utilities for safe exports or analytics.
- AuditLog: Immutable, tamper-evident audit trail capturing all DSR actions, consent changes, and legal hold events.

**Section sources**
- [dsr_service.py:36-77](file://backend/django/apps/core/dsr_service.py#L36-L77)
- [dsar_service.py:59-86](file://data/src/dsar_service.py#L59-L86)
- [processors.py:668-761](file://data/src/processors.py#L668-L761)
- [retention_manager.py:188-226](file://data/src/gdpr/retention_manager.py#L188-L226)
- [models.py:67-151](file://backend/django/apps/core/models.py#L67-L151)

## Architecture Overview
End-to-end flow for erasure and restriction:
- Requests enter via backend services or DSAR orchestrator
- Legal holds and retention rules are checked before any deletion
- Soft deletes and domain-specific cascades are applied
- All actions are recorded in an immutable audit log
- Scheduled jobs periodically purge expired data respecting legal holds

```mermaid
sequenceDiagram
participant Client as "Client"
participant Backend as "DataIntegration"
participant DSR as "DataSubjectRequestService"
participant RetMgr as "RetentionManager"
participant Proc as "Processors"
participant Audit as "AuditLog"
Client->>Backend : "Erasure request (subject_id)"
Backend->>RetMgr : "Check legal holds"
RetMgr-->>Backend : "Allowed or blocked"
alt Allowed
Backend->>DSR : "process_erasure_request(subject_id)"
DSR->>Proc : "delete_data_subject_data(subject_id)"
Proc-->>DSR : "Deletion result"
DSR->>Audit : "Log DSR_ERASE"
DSR-->>Backend : "Result"
Backend-->>Client : "Response"
else Blocked
Backend-->>Client : "Blocked due to legal hold"
end
```

**Diagram sources**
- [data_integration.py:307-342](file://backend/django/apps/core/data_integration.py#L307-L342)
- [dsr_service.py:194-252](file://backend/django/apps/core/dsr_service.py#L194-L252)
- [retention_manager.py:257-317](file://data/src/gdpr/retention_manager.py#L257-L317)
- [processors.py:668-761](file://data/src/processors.py#L668-L761)
- [models.py:214-227](file://backend/django/apps/core/models.py#L214-L227)

## Detailed Component Analysis

### DataSubjectRequestService (Articles 17 and 18)
- Erasure (Art. 17): Validates legal holds and canonical records; performs selective erasure of non-canonical PII while retaining sacramental records where required; logs outcomes.
- Restriction (Art. 18): Applies a restriction marker to suspend processing while maintaining data integrity; logs the action with reason.
- Access and portability: Collects and exports personal data in machine-readable formats; logs completion.

```mermaid
classDiagram
class DataSubjectRequestService {
+create_request(...)
+process_access_request(...)
+process_rectification_request(...)
+process_erasure_request(...)
+process_restriction_request(...)
+process_portability_request(...)
-_collect_personal_data(...)
-_erase_all_data(...)
-_erase_non_canonical_data(...)
-_get_canonical_records(...)
-_apply_restriction(...)
-_apply_objection(...)
}
```

**Diagram sources**
- [dsr_service.py:36-77](file://backend/django/apps/core/dsr_service.py#L36-L77)
- [dsr_service.py:194-252](file://backend/django/apps/core/dsr_service.py#L194-L252)
- [dsr_service.py:254-280](file://backend/django/apps/core/dsr_service.py#L254-L280)

**Section sources**
- [dsr_service.py:194-252](file://backend/django/apps/core/dsr_service.py#L194-L252)
- [dsr_service.py:254-280](file://backend/django/apps/core/dsr_service.py#L254-L280)

### DSARService Orchestration
- Aggregates per-processor results for access and erasure
- Supports dry-run mode for safe testing
- Tracks total deleted/retained counts and errors
- Exports JSON for portability

```mermaid
sequenceDiagram
participant Caller as "Caller"
participant DSAR as "DSARService"
participant ProcU as "UserdataProcessor"
participant ProcD as "DonationProcessor"
participant Audit as "AuditLogger"
Caller->>DSAR : "delete_all_data(subject_id, dry_run)"
DSAR->>Audit : "Log dsar_erasure_started"
DSAR->>ProcU : "delete_data_subject_data(subject_id)"
ProcU-->>DSAR : "DeletionResult"
DSAR->>ProcD : "delete_data_subject_data(subject_id)"
ProcD-->>DSAR : "DeletionResult"
DSAR->>Audit : "Log dsar_erasure_completed"
DSAR-->>Caller : "CompositeDeletionResult"
```

**Diagram sources**
- [dsar_service.py:159-267](file://data/src/dsar_service.py#L159-L267)
- [processors.py:668-761](file://data/src/processors.py#L668-L761)

**Section sources**
- [dsar_service.py:159-267](file://data/src/dsar_service.py#L159-L267)

### Processors: User Data Deletion
- Checks for active organization memberships; if present, blocks deletion and reports exemptions
- Performs soft delete on user account fields (marking deleted, inactive, redacting email/name)
- Audits each step and returns detailed results including retained records and errors

```mermaid
flowchart TD
Start(["Delete User Data"]) --> CheckMemberships["Check active memberships"]
CheckMemberships --> HasMemberships{"Active memberships?"}
HasMemberships -- "Yes" --> Block["Block deletion<br/>Report exemption"]
HasMemberships -- "No" --> SoftDelete["Soft-delete user record<br/>Redact identifiers"]
SoftDelete --> Audit["Audit log deletion"]
Block --> End(["Return result"])
Audit --> End
```

**Diagram sources**
- [processors.py:668-761](file://data/src/processors.py#L668-L761)

**Section sources**
- [processors.py:668-761](file://data/src/processors.py#L668-L761)

### Retention Manager and Legal Holds
- Centralized retention rules by data type with legal basis references
- LegalHoldRegistry prevents deletion when holds are active (litigation, investigation, audit, subpoena, law enforcement)
- Pre-checks ensure compliance before any deletion operation
- Dry-run support for planning and verification

```mermaid
flowchart TD
Start(["Retention Cleanup"]) --> GetRule["Load retention rule"]
GetRule --> ComputeCutoff["Compute cutoff date"]
ComputeCutoff --> CheckHolds["Check legal holds for subjects"]
CheckHolds --> SkipHolds{"Any active holds?"}
SkipHolds -- "Yes" --> Exclude["Exclude from deletion"]
SkipHolds -- "No" --> DeleteExpired["Delete expired records"]
DeleteExpired --> Log["Audit log cleanup"]
Exclude --> Log
Log --> End(["Stats returned"])
```

**Diagram sources**
- [retention_manager.py:188-226](file://data/src/gdpr/retention_manager.py#L188-L226)
- [retention_manager.py:257-317](file://data/src/gdpr/retention_manager.py#L257-L317)

**Section sources**
- [retention_manager.py:188-226](file://data/src/gdpr/retention_manager.py#L188-L226)
- [retention_manager.py:257-317](file://data/src/gdpr/retention_manager.py#L257-L317)

### Anonymizer Utilities
- Country-specific k-anonymity thresholds
- Hashing direct identifiers for safe exports or analytics
- Grouping and checking k-anonymity compliance

```mermaid
classDiagram
class KAnonymizer {
+anonymize(record) Dict
+anonymize_count(count) int
+check_k_anonymity(records, quasi_identifiers) Dict
-_group_records(records, group_by) Dict
}
class AnonymizationConfig {
+k : int
+country_code : str
+quasi_identifiers : List[str]
+suppression_char : str
}
KAnonymizer --> AnonymizationConfig : "uses"
```

**Diagram sources**
- [anonymizer.py:86-143](file://data/src/gdpr/anonymizer.py#L86-L143)

**Section sources**
- [anonymizer.py:86-143](file://data/src/gdpr/anonymizer.py#L86-L143)

### Airflow Scheduled Cleanup
- Daily DAG triggers retention-based cleanup for operational logs and user activity
- Uses RetentionManager to respect legal holds and retention rules
- Includes verification task post-cleanup

```mermaid
sequenceDiagram
participant Scheduler as "Airflow Scheduler"
participant DAG as "jol_gdpr_cleanup"
participant Task as "cleanup_expired_data"
participant RM as "RetentionManager"
Scheduler->>DAG : "Run daily at 4 AM"
DAG->>Task : "Execute for 'operational_log'"
Task->>RM : "delete_expired(data_type, dry_run)"
RM-->>Task : "Stats"
DAG->>Task : "Execute for 'user_activity'"
Task->>RM : "delete_expired(data_type, dry_run)"
RM-->>Task : "Stats"
DAG->>Scheduler : "Verification complete"
```

**Diagram sources**
- [jol_gdpr_cleanup.py:21-28](file://data/airflow/dags/jol_gdpr_cleanup.py#L21-L28)

**Section sources**
- [jol_gdpr_cleanup.py:21-28](file://data/airflow/dags/jol_gdpr_cleanup.py#L21-L28)

## Dependency Analysis
- DataSubjectRequestService depends on organization policies and canonical record handling; it logs DSR actions to AuditLog.
- DSARService composes multiple processors and relies on an audit logger for consistent tracking.
- RetentionManager integrates with LegalHoldRegistry to enforce legal holds across all deletion paths.
- Processors interact directly with database connections to perform soft deletes and constraint checks.
- Airflow DAGs depend on RetentionManager for batch operations.

```mermaid
graph LR
DSR["DataSubjectRequestService"] --> AL["AuditLog"]
DSAR["DSARService"] --> PROC["Processors"]
DSAR --> AUD["AuditLogger"]
PROC --> DB["Database"]
RM["RetentionManager"] --> LHR["LegalHoldRegistry"]
DAG["Airflow DAG"] --> RM
```

**Diagram sources**
- [dsr_service.py:36-77](file://backend/django/apps/core/dsr_service.py#L36-L77)
- [dsar_service.py:59-86](file://data/src/dsar_service.py#L59-L86)
- [retention_manager.py:188-226](file://data/src/gdpr/retention_manager.py#L188-L226)
- [jol_gdpr_cleanup.py:21-28](file://data/airflow/dags/jol_gdpr_cleanup.py#L21-L28)

**Section sources**
- [dsr_service.py:36-77](file://backend/django/apps/core/dsr_service.py#L36-L77)
- [dsar_service.py:59-86](file://data/src/dsar_service.py#L59-L86)
- [retention_manager.py:188-226](file://data/src/gdpr/retention_manager.py#L188-L226)
- [jol_gdpr_cleanup.py:21-28](file://data/airflow/dags/jol_gdpr_cleanup.py#L21-L28)

## Performance Considerations
- Prefer soft deletes to preserve referential integrity and enable restoration when needed.
- Batch operations should be guarded by legal hold checks to avoid unnecessary work.
- Use dry-run modes extensively in DSAR and retention tasks to plan impact without side effects.
- Audit logging is append-only; ensure efficient indexing on key fields (entity_type, entity_id, data_subject_id, created_at).
- For large datasets, consider pagination in processor queries and asynchronous processing where feasible.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Erasure blocked by legal hold: Review active legal holds and lift them when appropriate; verify litigation/investigation status.
- Active memberships preventing deletion: Transfer ownership or remove memberships before proceeding with erasure.
- Canonical records exception: Respect canonical record retention; use force flag only under explicit policy approval.
- Partial failures in DSAR: Inspect per-processor error lists and retry failed categories; ensure external dependencies are available.
- Audit integrity: Verify checksums on audit entries to detect tampering; recompute expected values using stored metadata.

**Section sources**
- [retention_manager.py:257-317](file://data/src/gdpr/retention_manager.py#L257-L317)
- [processors.py:668-761](file://data/src/processors.py#L668-L761)
- [dsr_service.py:194-252](file://backend/django/apps/core/dsr_service.py#L194-L252)
- [models.py:205-227](file://backend/django/apps/core/models.py#L205-L227)

## Conclusion
JOL-HUB implements robust, auditable mechanisms for GDPR Articles 17 and 18:
- Erasure workflows combine soft deletes, constraint checks, retention rules, and legal hold enforcement
- Restriction workflows pause processing while preserving data integrity
- Comprehensive audit trails and scheduled cleanup ensure ongoing compliance
- Extensible processor architecture supports complex data relationships and future integrations

[No sources needed since this section summarizes without analyzing specific files]