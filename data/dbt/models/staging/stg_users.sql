-- Staging: Users
-- Source: raw user data with GDPR-compliant handling

{{ config(
    materialized='view',
    schema='staging',
    tags=['gdpr', 'users']
) }}

with source_data as (
    select
        id,
        -- Mask email for privacy unless explicitly requested
        case
            when '{{ var("include_pii", "false") }}' = 'true'
            then email
            else regexp_replace(email, '(.{2}).+(@.+)', '\1***\2')
        end as email,
        organization_id,
        role,
        is_active,
        is_staff,
        is_superuser,
        -- Mask IP addresses
        case
            when '{{ var("include_pii", "false") }}' = 'true'
            then last_login_ip
            else substring(last_login_ip from 1 for position('.' in last_login_ip)) || 'xxx.xxx'
        end as last_login_ip,
        last_login_at,
        created_at,
        updated_at,
        -- GDPR fields
        consent_marketing,
        consent_analytics,
        consent_third_party,
        consent_updated_at,
        -- Data classification
        'confidential' as data_classification,
        -- Retention expiry
        coalesce(
            last_login_at,
            created_at
        ) + interval '{{ var("user_data_retention_days", 730) }} days' as retention_expiry
    from {{ source('raw', 'users') }}
    where deleted_at is null
)

select * from source_data
