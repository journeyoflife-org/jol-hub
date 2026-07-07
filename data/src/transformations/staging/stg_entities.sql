-- Staging: Entity Deduplication
-- GDPR Classification: CONFIDENTIAL
-- Purpose: Deduplicate entity records before loading

{{ config(
    materialized='view',
    schema='staging',
    tags=['gdpr', 'entities']
) }}

with ranked_entities as (
    select
        *,
        -- Rank by recency and completeness
        row_number() over (
            partition by entity_id
            order by 
                updated_at desc nulls last,
                case 
                    when email is not null then 1 
                    when phone is not null then 2 
                    else 3 
                end
        ) as dedupe_rank
    from {{ source('raw', 'entities') }}
    where deleted_at is null
)

select
    id,
    entity_id,
    entity_type,
    -- Mask PII fields
    case
        when '{{ var("include_pii", "false") }}' = 'true'
        then name
        else substring(name from 1 for 2) || '***'
    end as name,
    organization_id,
    country_code,
    is_active,
    created_at,
    updated_at
from ranked_entities
where dedupe_rank = 1  -- Keep only most recent/complete record
