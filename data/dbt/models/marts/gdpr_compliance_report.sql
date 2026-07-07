-- Mart: GDPR Compliance Report
-- Provides compliance metrics for GDPR Article 30 reporting

{{ config(
    materialized='table',
    schema='gdpr_compliance',
    tags=['gdpr', 'compliance', 'reporting']
) }}

with processing_activities as (
    select
        'donation_processing' as activity_name,
        count(*) as total_records_processed,
        count(distinct donor_id) as unique_data_subjects,
        min(created_at) as earliest_record,
        max(created_at) as latest_record,
        'confidential' as data_classification,
        'Contract performance (Art. 6(1)(b))' as legal_basis,
        2555 as retention_days
    from {{ ref('stg_donations') }}
    
    union all
    
    select
        'user_management' as activity_name,
        count(*) as total_records_processed,
        count(distinct id) as unique_data_subjects,
        min(created_at) as earliest_record,
        max(created_at) as latest_record,
        'confidential' as data_classification,
        'Contract performance (Art. 6(1)(b))' as legal_basis,
        730 as retention_days
    from {{ ref('stg_users') }}
),

retention_status as (
    select
        activity_name,
        total_records_processed,
        unique_data_subjects,
        earliest_record,
        latest_record,
        data_classification,
        legal_basis,
        retention_days,
        -- Calculate records approaching retention expiry (30 days warning)
        case
            when latest_record + (retention_days || ' days')::interval 
                 < current_date + interval '30 days'
            then true
            else false
        end as approaching_retention_expiry
    from processing_activities
)

select
    activity_name,
    total_records_processed,
    unique_data_subjects,
    earliest_record,
    latest_record,
    data_classification,
    legal_basis,
    retention_days,
    approaching_retention_expiry,
    current_timestamp as report_generated_at
from retention_status
