-- ====================================================================
-- TalentVerse AI - Web Portal (DCM) Performance Optimization Script
-- ====================================================================

-- 1. Create B-Tree Indexes for fast filtering, pagination and sorting
CREATE INDEX IF NOT EXISTS idx_candidates_processed_timestamp 
  ON candidates (processed_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_candidates_classification 
  ON candidates (classification);

CREATE INDEX IF NOT EXISTS idx_candidates_platform_name 
  ON candidates (platform_name);

CREATE INDEX IF NOT EXISTS idx_candidates_dcm_type 
  ON candidates (dcm_type);

CREATE INDEX IF NOT EXISTS idx_candidates_composite_filter 
  ON candidates (classification, platform_name, dcm_type);

-- Trigram / pattern search index for candidate names
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_candidates_name_trgm 
  ON candidates USING gin (candidate_name gin_trgm_ops);

-- 2. Fast Stored Procedure / RPC function for Dashboard Analytics
-- This calculates all totals, DCM counts, platform counts, and chart distributions server-side
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS json
LANGUAGE sql
STABLE
AS $$
WITH 
  today_calc AS (
    SELECT date_trunc('day', NOW()) AS today_start,
           NOW() - INTERVAL '30 days' AS one_month_ago,
           NOW() - INTERVAL '60 days' AS two_months_ago,
           NOW() - INTERVAL '7 days' AS one_week_ago,
           NOW() - INTERVAL '14 days' AS two_weeks_ago
  ),
  overall_stats AS (
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE classification = 'FIT') AS fit,
      COUNT(*) FILTER (WHERE classification = 'UNFIT') AS unfit,
      COUNT(*) FILTER (WHERE classification IN ('Pending', 'Error')) AS error,
      COUNT(*) FILTER (WHERE processed_timestamp >= (SELECT today_start FROM today_calc)) AS processed_today,
      COUNT(DISTINCT dcm_type) FILTER (WHERE dcm_type IS NOT NULL AND dcm_type NOT IN ('N/A', 'Unknown', '')) AS active_dcms,
      COUNT(DISTINCT platform_name) FILTER (WHERE platform_name IS NOT NULL AND platform_name NOT IN ('N/A', 'Unknown', '')) AS unique_platforms,
      COUNT(*) FILTER (WHERE processed_timestamp >= (SELECT one_month_ago FROM today_calc)) AS candidates_this_month,
      COUNT(*) FILTER (WHERE processed_timestamp >= (SELECT two_months_ago FROM today_calc) AND processed_timestamp < (SELECT one_month_ago FROM today_calc)) AS candidates_last_month,
      COUNT(*) FILTER (WHERE classification = 'FIT' AND processed_timestamp >= (SELECT one_week_ago FROM today_calc)) AS fit_this_week,
      COUNT(*) FILTER (WHERE classification = 'FIT' AND processed_timestamp >= (SELECT two_weeks_ago FROM today_calc) AND processed_timestamp < (SELECT one_week_ago FROM today_calc)) AS fit_last_week,
      COUNT(*) FILTER (WHERE classification = 'UNFIT' AND processed_timestamp >= (SELECT one_week_ago FROM today_calc)) AS unfit_this_week,
      COUNT(*) FILTER (WHERE classification = 'UNFIT' AND processed_timestamp >= (SELECT two_weeks_ago FROM today_calc) AND processed_timestamp < (SELECT one_week_ago FROM today_calc)) AS unfit_last_week
    FROM candidates
  ),
  daily_series AS (
    SELECT generate_series(
      date_trunc('day', NOW() - INTERVAL '6 days'),
      date_trunc('day', NOW()),
      '1 day'::interval
    ) AS day_date
  ),
  daily_counts AS (
    SELECT 
      date_trunc('day', processed_timestamp) AS day_date,
      COUNT(*) FILTER (WHERE classification = 'FIT') AS fit_count,
      COUNT(*) FILTER (WHERE classification = 'UNFIT') AS unfit_count
    FROM candidates
    WHERE processed_timestamp >= date_trunc('day', NOW() - INTERVAL '6 days')
    GROUP BY date_trunc('day', processed_timestamp)
  ),
  daily_trend AS (
    SELECT json_agg(
      json_build_object(
        'date', to_char(d.day_date, 'YYYY-MM-DD'),
        'FIT', COALESCE(c.fit_count, 0),
        'UNFIT', COALESCE(c.unfit_count, 0)
      ) ORDER BY d.day_date ASC
    ) AS data
    FROM daily_series d
    LEFT JOIN daily_counts c ON d.day_date = c.day_date
  ),
  platform_dist AS (
    SELECT json_agg(
      json_build_object('name', platform_name, 'value', count_val)
    ) AS data
    FROM (
      SELECT platform_name, COUNT(*) as count_val
      FROM candidates
      WHERE platform_name IS NOT NULL AND platform_name NOT IN ('N/A', 'Unknown', '')
        AND processed_timestamp >= (SELECT two_months_ago FROM today_calc)
      GROUP BY platform_name
      ORDER BY count_val DESC
      LIMIT 5
    ) p
  ),
  dcm_dist AS (
    SELECT json_agg(
      json_build_object('name', dcm_type, 'size', count_val)
    ) AS data
    FROM (
      SELECT dcm_type, COUNT(*) as count_val
      FROM candidates
      WHERE dcm_type IS NOT NULL AND dcm_type NOT IN ('N/A', 'Unknown', '')
        AND processed_timestamp >= (SELECT two_months_ago FROM today_calc)
      GROUP BY dcm_type
      ORDER BY count_val DESC
      LIMIT 20
    ) d
  ),
  recent_chart AS (
    SELECT json_agg(
      json_build_object(
        'classification', CASE WHEN classification = 'Pending' THEN 'Error' ELSE classification END,
        'platform_name', platform_name,
        'dcm_type', dcm_type,
        'processed_timestamp', processed_timestamp
      )
    ) AS data
    FROM (
      SELECT classification, platform_name, dcm_type, processed_timestamp
      FROM candidates
      ORDER BY processed_timestamp DESC
      LIMIT 2000
    ) sub
  )
SELECT json_build_object(
  'totals', (
    SELECT json_build_object(
      'total', total,
      'fit', fit,
      'unfit', unfit,
      'error', error,
      'processedToday', processed_today,
      'activeDCMs', active_dcms,
      'uniquePlatforms', unique_platforms
    ) FROM overall_stats
  ),
  'trends', (
    SELECT json_build_object(
      'candidatesThisMonth', candidates_this_month,
      'candidatesLastMonth', candidates_last_month,
      'fitThisWeek', fit_this_week,
      'fitLastWeek', fit_last_week,
      'unfitThisWeek', unfit_this_week,
      'unfitLastWeek', unfit_last_week
    ) FROM overall_stats
  ),
  'dailyTrend', (SELECT data FROM daily_trend),
  'platformDistribution', (SELECT data FROM platform_dist),
  'dcmDistribution', (SELECT data FROM dcm_dist),
  'chartData', (SELECT data FROM recent_chart)
);
$$;

-- 3. Fast RPC function for Live Bot Status page
CREATE OR REPLACE FUNCTION get_today_bot_status()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  today_start timestamp with time zone := date_trunc('day', NOW());
BEGIN
  SELECT json_build_object(
    'totalProcessed', (
      SELECT COUNT(*) FROM candidates WHERE processed_timestamp >= today_start
    ),
    'dcmStats', (
      SELECT json_agg(
        json_build_object(
          'dcm_type', dcm_type,
          'count', count_val,
          'earliestTs', extract(epoch from earliest_ts) * 1000,
          'latestTs', extract(epoch from latest_ts) * 1000
        )
      )
      FROM (
        SELECT 
          dcm_type,
          COUNT(*) as count_val,
          MIN(processed_timestamp) as earliest_ts,
          MAX(processed_timestamp) as latest_ts
        FROM candidates
        WHERE processed_timestamp >= today_start
          AND dcm_type IS NOT NULL
        GROUP BY dcm_type
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$$;
