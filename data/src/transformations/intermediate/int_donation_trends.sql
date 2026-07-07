-- Intermediate: Donation Trends
-- GDPR Classification: INTERNAL (aggregated)
-- Purpose: Calculate donation trends with k-anonymity

{{ config(
    materialized='table',
    schema='intermediate',
    tags=['gdpr', 'analytics', 'k_anonymity']
) }}

with daily_donations as (
    select
        date_trunc('day', donation_date) as donation_day,
        country_code,
        organization_type,
        sum(amount) as daily_total,
        count(*) as donation_count,
        count(distinct donor_id) as unique_donors,
        avg(amount) as avg_amount,
        percentile_cont(0.5) within group (order by amount) as median_amount
    from {{ ref('stg_donations') }}
    where deleted_at is null
    group by 1, 2, 3
    -- K-anonymity filter: suppress groups with < 5 donors
    having count(distinct donor_id) >= 5
),

trend_metrics as (
    select
        *,
        -- 7-day moving average
        avg(daily_total) over (
            partition by country_code, organization_type
            order by donation_day
            rows between 6 preceding and current row
        ) as rolling_7day_avg,
        
        -- Week-over-week change
        lag(daily_total, 7) over (
            partition by country_code, organization_type
            order by donation_day
        ) as prev_week_total,
        
        -- Month-over-month change
        lag(daily_total, 30) over (
            partition by country_code, organization_type
            order by donation_day
        ) as prev_month_total
    from daily_donations
)

select
    donation_day,
    country_code,
    organization_type,
    daily_total,
    donation_count,
    -- K-anonymized donor count (rounded to nearest 5)
    (unique_donors / 5) * 5 as unique_donors_anonymized,
    avg_amount,
    median_amount,
    rolling_7day_avg,
    case
        when prev_week_total > 0 
        then round((daily_total - prev_week_total) / prev_week_total * 100, 2)
        else null
    end as wow_change_pct,
    case
        when prev_month_total > 0
        then round((daily_total - prev_month_total) / prev_month_total * 100, 2)
        else null
    end as mom_change_pct
from trend_metrics
