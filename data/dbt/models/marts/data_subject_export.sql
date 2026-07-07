-- Mart: GDPR Data Subject Export
-- Used for GDPR Art. 20 - Right to Data Portability

{{ config(
    materialized='table',
    schema='gdpr_compliance',
    tags=['gdpr', 'data_subject_rights']
) }}

-- This model aggregates all data for a specific data subject
-- Used when processing portability requests

with user_data as (
    select
        id as user_id,
        email,
        organization_id,
        role,
        created_at as account_created,
        consent_marketing,
        consent_analytics,
        consent_third_party
    from {{ ref('stg_users') }}
),

donation_data as (
    select
        donor_id,
        jsonb_agg(
            jsonb_build_object(
                'donation_id', id,
                'amount', amount,
                'currency', currency,
                'date', donation_date,
                'payment_method', payment_method
            )
        ) as donations
    from {{ ref('stg_donations') }}
    group by donor_id
)

select
    u.user_id,
    u.email,
    u.organization_id,
    u.role,
    u.account_created,
    u.consent_marketing,
    u.consent_analytics,
    u.consent_third_party,
    coalesce(d.donations, '[]'::jsonb) as donations,
    current_timestamp as export_timestamp
from user_data u
left join donation_data d on u.user_id = d.donor_id
