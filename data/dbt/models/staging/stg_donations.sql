-- Staging: Donations
-- Source: raw donation data with GDPR-compliant column handling

{{ config(
    materialized='view',
    schema='staging',
    tags=['gdpr', 'financial']
) }}

with source_data as (
    select
        id,
        donor_id,
        organization_id,
        amount,
        currency,
        donation_date,
        payment_method,
        -- Mask sensitive payment data for non-authorized access
        case
            when '{{ var("include_pii", "false") }}' = 'true'
            then payment_reference
            else '***REDACTED***'
        end as payment_reference,
        created_at,
        updated_at,
        -- GDPR: Add data classification
        'confidential' as data_classification,
        -- GDPR: Add retention expiry
        created_at + interval '{{ var("financial_retention_days", 2555) }} days' as retention_expiry
    from {{ source('raw', 'donations') }}
    where deleted_at is null
)

select * from source_data
