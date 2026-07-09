const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://lrgmzwjcwxtknzfbghto.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZ216d2pjd3h0a256ZmJnaHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE3Njg4NywiZXhwIjoyMDk2NzUyODg3fQ.eEWYV_-P4KQwtHs9D5D4wLSss16cklUTvlYM74D50nc'
);
async function test() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const { count } = await supabase.from('candidates')
    .select('*', { count: 'exact', head: true })
    .gte('processed_timestamp', d.toISOString());
  console.log('Candidates in last 7 days:', count);
}
test();
