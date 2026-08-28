import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { queue, action } = await request.json();

    if (!queue || !action) {
      return NextResponse.json({ error: 'Missing queue or action' }, { status: 400 });
    }

    if (queue !== 'queue1' && queue !== 'queue2') {
      return NextResponse.json({ error: 'Invalid queue name' }, { status: 400 });
    }

    const validActions = ['skip', 'stop', 'pause', 'resume'];
    if (!validActions.includes(action.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const queueId = queue === 'queue1' ? 1 : 2;

    // Insert command into Supabase bot_commands table for the VPS Master Scheduler to consume
    const { data, error } = await supabase
      .from('bot_commands')
      .insert([
        {
          queue_id: queueId,
          command: action.toLowerCase(),
          is_processed: false
        }
      ])
      .select();

    if (error) {
      console.error('Supabase bot_commands Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Command '${action}' queued successfully for Queue ${queueId}`,
      data 
    });

  } catch (error: unknown) {
    console.error('VPS Control Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

