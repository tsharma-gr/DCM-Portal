/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lrgmzwjcwxtknzfbghto.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZ216d2pjd3h0a256ZmJnaHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE3Njg4NywiZXhwIjoyMDk2NzUyODg3fQ.eEWYV_-P4KQwtHs9D5D4wLSss16cklUTvlYM74D50nc";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: Request) {
  try {
    const { targetDate } = await request.json();
    if (!targetDate) {
      return NextResponse.json({ success: false, error: 'targetDate is required' }, { status: 400 });
    }

    const startIso = `${targetDate}T00:00:00.000Z`;
    const endIso = `${targetDate}T23:59:59.999Z`;

    // Fetch candidates processed on this date
    const allCandidates: { dcm_type: string }[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('candidates')
        .select('dcm_type')
        .gte('processed_timestamp', startIso)
        .lte('processed_timestamp', endIso)
        .range(from, from + step - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allCandidates.push(...data);
      if (data.length < step) break;
      from += step;
    }

    // Group count per DCM bot
    const dcmCounts: Record<string, number> = {};
    allCandidates.forEach(item => {
      const dcm = item.dcm_type || 'Unknown DCM';
      dcmCounts[dcm] = (dcmCounts[dcm] || 0) + 1;
    });

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUSD = 0;
    const bots: { name: string; tokensStr: string; costStr: string }[] = [];

    // DeepSeek V3 pricing: $0.14 / 1M input, $0.28 / 1M output
    // Average tokens per candidate evaluation: ~1,450 input, ~180 output
    for (const [dcmName, count] of Object.entries(dcmCounts)) {
      const input = count * 1450;
      const output = count * 180;
      const total = input + output;
      const cost = (input / 1_000_000 * 0.14) + (output / 1_000_000 * 0.28);

      totalInputTokens += input;
      totalOutputTokens += output;
      totalCostUSD += cost;

      bots.push({
        name: dcmName,
        tokensStr: `${total.toLocaleString()} (In: ${input.toLocaleString()} | Out: ${output.toLocaleString()})`,
        costStr: `$${cost.toFixed(4)}`
      });
    }

    // Sort bots by candidate count descending
    bots.sort((a, b) => {
      const countA = parseInt(a.tokensStr.split(' ')[0].replace(/,/g, ''), 10) || 0;
      const countB = parseInt(b.tokensStr.split(' ')[0].replace(/,/g, ''), 10) || 0;
      return countB - countA;
    });

    const grandTotal = {
      input: totalInputTokens.toLocaleString(),
      output: totalOutputTokens.toLocaleString(),
      total: (totalInputTokens + totalOutputTokens).toLocaleString(),
      cost: `$${totalCostUSD.toFixed(4)}`
    };

    return NextResponse.json({
      success: true,
      text: "Calculated from Supabase candidate processing records",
      parsed: { bots, grandTotal }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Token usage API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

