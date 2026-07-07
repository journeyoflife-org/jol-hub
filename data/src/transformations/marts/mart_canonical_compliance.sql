-- Mart: Canonical Compliance Report
-- GDPR Classification: INTERNAL
-- Purpose: Track compliance with GDPR and Canon Law requirements

{{ config(
    materialized='table',
    schema='marts',
    tags=['gdpr', 'compliance', 'reporting']
) }}

with compliance_metrics as (
    select
        organization_id,
        organization_name,
        country_code,
        
        -- GDPR Article 30: Processing activities documented
        case 
            when processing_activities_count > 0 then true 
            else false 
        end as has_processing_activities,
        
        -- GDPR Article 7: Consent records
        case 
            when consent_records_count > 0 
             and last_consent_updated > current_date - interval '1 year'
            then true 
            else false 
        end as has_valid_consent,
        
        -- GDPR Article 17: Retention policy
        case 
            when retention_policy_days is not null 
             and retention_policy_days <= 2555  -- Max 7 years
            then true 
            else false 
        end as has_valid_retention,
        
        -- GDPR Article 32: Security measures
        case 
            when encryption_at_rest = true 
             and access_controls = true 
             and audit_logging = true
            then true 
            else false 
        end as has_security_measures,
        
        -- Canon Law: Parish registration
        case 
            when parish_registration_date is not null 
            then true 
            else false 
        end as is_canonically_registered,
        
        -- Data quality
        entity_completeness_score,
        last_audit_date,
        audit_findings_count
        
    from {{ ref('stg_organizations') }}
),

compliance_score as (
    select
        *,
        -- Calculate overall compliance score (0-100)
        (
            case when has_processing_activities then 15 else 0 end +
            case when has_valid_consent then 20 else 0 end +
            case when has_valid_retention then 15 else 0 end +
            case when has_security_measures then 20 else 0 end +
            case when is_canonically_registered then 15 else 0 end +
            case when entity_completeness_score >= 0.9 then 15 else entity_completeness_score * 15 end
        ) as overall_score,
        
        -- Identify compliance gaps
        case when not has_processing_activities then 'Missing processing activities (Art. 30)' end as gap_art30,
        case when not has_valid_consent then 'Invalid or missing consent (Art. 7)' end as gap_art7,
        case when not has_valid_retention then 'Invalid retention policy (Art. 17)' end as gap_art17,
        case when not has_security_measures then 'Missing security measures (Art. 32)' end as gap_art32
    from compliance_metrics
)

select
    organization_id,
    organization_name,
    country_code,
    
    -- Compliance status
    overall_score,
    case
        when overall_score >= 90 then 'COMPLIANT'
        when overall_score >= 70 then 'PARTIALLY_COMPLIANT'
        when overall_score >= 50 then 'AT_RISK'
        else 'NON_COMPLIANT'
    end as compliance_status,
    
    -- Individual compliance checks
    has_processing_activities,
    has_valid_consent,
    has_valid_retention,
    has_security_measures,
    is_canonically_registered,
    
    -- Gaps (for remediation)
    gap_art30,
    gap_art7,
    gap_art17,
    gap_art32,
    
    -- Metadata
    current_timestamp as report_generated_at
from compliance_score
order by overall_score asc, country_code, organization_name
