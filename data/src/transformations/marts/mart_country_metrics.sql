-- Mart: Country Metrics
-- GDPR Classification: PUBLIC (aggregated, k-anonymized)
-- Purpose: Country-level aggregated metrics for 27 EU countries

{{ config(
    materialized='table',
    schema='marts',
    tags=['gdpr', 'analytics', 'k_anonymity', 'reporting']
) }}

with country_metrics as (
    select
        country_code,
        -- Entity counts (public data)
        count(distinct case when entity_type = 'parish' then entity_id end) as parish_count,
        count(distinct case when entity_type = 'priest' then entity_id end) as priest_count,
        count(distinct organization_id) as organization_count,
        
        -- Donation metrics (k-anonymized)
        sum(donation_total) as total_donations_amount,
        sum(donation_count) as total_donation_count,
        
        -- Unique donors (k-anonymized, rounded to nearest 5)
        (count(distinct donor_id) / 5) * 5 as unique_donors_anonymized,
        
        -- Period
        min(created_at) as earliest_record,
        max(updated_at) as latest_record
    from {{ ref('stg_entities') }} e
    left join (
        select 
            country_code,
            sum(amount) as donation_total,
            count(*) as donation_count,
            count(distinct donor_id) as donor_id
        from {{ ref('stg_donations') }}
        group by country_code
        having count(distinct donor_id) >= 5  -- K-anonymity
    ) d using (country_code)
    group by country_code
)

select
    country_code,
    -- Map to country name
    case country_code
        when 'LT' then 'Lithuania'
        when 'LV' then 'Latvia'
        when 'EE' then 'Estonia'
        when 'FI' then 'Finland'
        when 'SE' then 'Sweden'
        when 'NO' then 'Norway'
        when 'DK' then 'Denmark'
        when 'DE' then 'Germany'
        when 'PL' then 'Poland'
        when 'CZ' then 'Czech Republic'
        when 'SK' then 'Slovakia'
        when 'AT' then 'Austria'
        when 'HU' then 'Hungary'
        when 'SI' then 'Slovenia'
        when 'HR' then 'Croatia'
        when 'IT' then 'Italy'
        when 'ES' then 'Spain'
        when 'PT' then 'Portugal'
        when 'FR' then 'France'
        when 'BE' then 'Belgium'
        when 'NL' then 'Netherlands'
        when 'LU' then 'Luxembourg'
        when 'IE' then 'Ireland'
        when 'GB' then 'United Kingdom'
        when 'GR' then 'Greece'
        when 'CY' then 'Cyprus'
        when 'MT' then 'Malta'
    end as country_name,
    
    parish_count,
    priest_count,
    organization_count,
    
    -- All financial data is k-anonymized
    round(total_donations_amount, 2) as total_donations_amount,
    total_donation_count,
    unique_donors_anonymized,
    
    -- Compliance metadata
    earliest_record,
    latest_record,
    current_timestamp as report_generated_at,
    
    -- GDPR compliance indicators
    true as is_k_anonymized,
    5 as k_value  -- k=5 for all aggregations
from country_metrics
where parish_count >= 5  -- K-anonymity for entity counts too
order by country_code
