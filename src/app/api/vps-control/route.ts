import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

    const scriptName = `${queue}_scheduler.py`;
    const signal = action === 'pause' ? 'STOP' : 'CONT';

    // We find the scheduler PID, then send the signal to it AND its child processes (main.py)
    const bashCommand = `
      PID=$(pgrep -f '${scriptName}')
      if [ -n "$PID" ]; then
        kill -${signal} $PID
        pkill -${signal} -P $PID
        echo "Success"
      else
        echo "Scheduler not found"
      fi
    `;

    const sshCommand = `ssh -o StrictHostKeyChecking=no root@139.59.191.27 "${bashCommand.replace(/\n/g, ' ')}"`;

    const { stdout, stderr } = await execAsync(sshCommand);

    if (stderr && !stderr.includes('Warning')) {
      console.error('SSH Stderr:', stderr);
    }

    return NextResponse.json({ success: true, message: stdout.trim() });

  } catch (error: unknown) {
    console.error('VPS Control Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
