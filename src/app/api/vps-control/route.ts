import { NextResponse } from 'next/server';

const SECRET_TOKEN = "tv_queue_master_secret_2026_xyz987";

export async function POST(request: Request) {
  try {
    const { queue, action } = await request.json();

    if (!queue || !action) {
      return NextResponse.json({ error: 'Missing queue or action' }, { status: 400 });
    }

    if (queue !== 'queue1' && queue !== 'queue2') {
      return NextResponse.json({ error: 'Invalid queue name' }, { status: 400 });
    }

    if (action !== 'pause' && action !== 'resume') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const vpsUrl = "https://139-59-191-27.nip.io";

    const response = await fetch(vpsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SECRET_TOKEN}`
      },
      body: JSON.stringify({ queue, action }),
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('VPS Listener Error:', data);
      return NextResponse.json({ error: data.error || 'Failed to communicate with VPS' }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: data.message || "Success" });

  } catch (error: unknown) {
    console.error('VPS Control Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
