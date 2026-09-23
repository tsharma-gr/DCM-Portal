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
-- Calculates 100% accurate totals, DCM counts, platform counts, and daily trends server-side
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  today_start timestamp with time zone := date_trunc('day', NOW());
  one_month_ago timestamp with time zone := NOW() - INTERVAL '30 days';
  two_months_ago timestamp with time zone := NOW() - INTERVAL '60 days';
  one_week_ago timestamp with time zone := NOW() - INTERVAL '7 days';
  two_weeks_ago timestamp with time zone := NOW() - INTERVAL '14 days';
  six_days_ago timestamp with time zone := date_trunc('day', NOW() - INTERVAL '6 days');
BEGIN
  SELECT json_build_object(
    'totals', (
      SELECT json_build_object(
        'total', COUNT(*),
        'fit', COUNT(*) FILTER (WHERE classification = 'FIT'),
        'unfit', COUNT(*) FILTER (WHERE classification = 'UNFIT'),
        'error', COUNT(*) FILTER (WHERE classification IN ('Pending', 'Error')),
        'processedToday', COUNT(*) FILTER (WHERE processed_timestamp >= today_start),
        'activeDCMs', COUNT(DISTINCT dcm_type) FILTER (WHERE dcm_type IS NOT NULL AND dcm_type NOT IN ('N/A', 'Unknown', '')),
        'uniquePlatforms', COUNT(DISTINCT platform_name) FILTER (WHERE platform_name IS NOT NULL AND platform_name NOT IN ('N/A', 'Unknown', ''))
      ) FROM candidates
    ),
    'trends', (
      SELECT json_build_object(
        'candidatesThisMonth', COUNT(*) FILTER (WHERE processed_timestamp >= one_month_ago),
        'candidatesLastMonth', COUNT(*) FILTER (WHERE processed_timestamp >= two_months_ago AND processed_timestamp < one_month_ago),
        'fitThisWeek', COUNT(*) FILTER (WHERE classification = 'FIT' AND processed_timestamp >= one_week_ago),
        'fitLastWeek', COUNT(*) FILTER (WHERE classification = 'FIT' AND processed_timestamp >= two_weeks_ago AND processed_timestamp < one_week_ago),
        'unfitThisWeek', COUNT(*) FILTER (WHERE classification = 'UNFIT' AND processed_timestamp >= one_week_ago),
        'unfitLastWeek', COUNT(*) FILTER (WHERE classification = 'UNFIT' AND processed_timestamp >= two_weeks_ago AND processed_timestamp < one_week_ago)
      ) FROM candidates
    ),
    'dailyTrend', (
      SELECT json_agg(
        json_build_object(
          'date', to_char(d.day_date, 'YYYY-MM-DD'),
          'FIT', COALESCE(c.fit_count, 0),
          'UNFIT', COALESCE(c.unfit_count, 0)
        ) ORDER BY d.day_date ASC
      )
      FROM generate_series(six_days_ago, today_start, '1 day'::interval) d(day_date)
      LEFT JOIN (
        SELECT 
          date_trunc('day', processed_timestamp) AS day_date,
          COUNT(*) FILTER (WHERE classification = 'FIT') AS fit_count,
          COUNT(*) FILTER (WHERE classification = 'UNFIT') AS unfit_count
        FROM candidates
        WHERE processed_timestamp >= six_days_ago
        GROUP BY date_trunc('day', processed_timestamp)
      ) c ON d.day_date = c.day_date
    ),
    'platformDistribution', (
      SELECT json_agg(
        json_build_object('name', platform_name, 'value', count_val)
      )
      FROM (
        SELECT platform_name, COUNT(*) as count_val
        FROM candidates
        WHERE platform_name IS NOT NULL AND platform_name NOT IN ('N/A', 'Unknown', '')
        GROUP BY platform_name
        ORDER BY count_val DESC
        LIMIT 10
      ) p
    ),
    'dcmDistribution', (
      SELECT json_agg(
        json_build_object('name', dcm_type, 'size', count_val)
      )
      FROM (
        SELECT dcm_type, COUNT(*) as count_val
        FROM candidates
        WHERE dcm_type IS NOT NULL AND dcm_type NOT IN ('N/A', 'Unknown', '')
        GROUP BY dcm_type
        ORDER BY count_val DESC
        LIMIT 50
      ) d
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions to public roles for Supabase PostgREST access
GRANT EXECUTE ON FUNCTION get_dashboard_summary() TO anon, authenticated, service_role;

-- 3. Fast RPC function for Live Bot Status page
CREATE OR REPLACE FUNCTION get_today_bot_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_today_bot_status() TO anon, authenticated, service_role;
