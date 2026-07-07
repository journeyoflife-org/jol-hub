-- GDPR Compliance Audit Queries
-- Classification: INTERNAL

-- Get all processing activities for a data subject (Article 15)
-- Parameters: :subject_id

SELECT 
    action,
    resource_type,
    resource_id,
    actor,
    created_at,
    metadata
FROM audit_log
WHERE 
    resource_id = :subject_id
    OR metadata->>'subject_id' = :subject_id
ORDER BY created_at DESC;

-- Get retention compliance status
SELECT 
    data_type,
    COUNT(*) FILTER (WHERE expires_at < NOW() AND deleted_at IS NULL) AS overdue,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted,
    COUNT(*) FILTER (WHERE legal_hold = TRUE) AS on_hold,
    COUNT(*) AS total
FROM retention_records
GROUP BY data_type
ORDER BY overdue DESC;

-- Get GDPR request status summary
SELECT 
    request_type,
    status,
    COUNT(*) AS count,
    AVG(EXTRACT(EPOCH FROM (completed_at - requested_at))/3600) AS avg_hours_to_complete
FROM gdpr_requests
WHERE requested_at > NOW() - INTERVAL '30 days'
GROUP BY request_type, status
ORDER BY request_type, status;

-- Get audit log activity by day (last 30 days)
SELECT 
    DATE(created_at) AS date,
    action,
    COUNT(*) AS event_count
FROM audit_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), action
ORDER BY date DESC, event_count DESC;

-- Get consent status for data subjects
SELECT 
    subject_id,
    jsonb_object_agg(
        consent_type,
        jsonb_build_object(
            'granted', granted,
            'granted_at', granted_at,
            'is_valid', granted AND (expires_at IS NULL OR expires_at > NOW())
        )
    ) AS consent_status
FROM consents
GROUP BY subject_id
HAVING NOT bool_and(granted AND (expires_at IS NULL OR expires_at > NOW()));
