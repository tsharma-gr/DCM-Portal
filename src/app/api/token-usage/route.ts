import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { targetDate } = await request.json();
    let cmd = 'ssh -o BatchMode=yes root@139.59.191.27 "python3 /root/daily_token_tracker.py"';
    if (targetDate) {
      cmd = `ssh -o BatchMode=yes root@139.59.191.27 "python3 /root/daily_token_tracker.py ${targetDate}"`;
    }
    
    const { stdout, stderr } = await execAsync(cmd);
    
    // Parse the output string into structured JSON
    const lines = stdout.split('\n');
    let grandTotal = null;
    let bots = [];
    
    let currentBot = null;
    let mode = ''; // 'breakdown' or 'total'

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      if (line.includes('### BREAKDOWN PER DCM BOT ###')) {
        mode = 'breakdown';
        continue;
      }
      
      if (line.includes('### GRAND TOTAL (ALL BOTS) ###')) {
        mode = 'total';
        grandTotal = {
          input: '0',
          output: '0',
          total: '0',
          cost: '$0.0000'
        };
        continue;
      }
      
      if (mode === 'breakdown') {
        if (line.startsWith('[') && line.endsWith(']')) {
          currentBot = {
            name: line.substring(1, line.length - 1),
            tokensStr: '',
            costStr: ''
          };
          bots.push(currentBot);
        } else if (currentBot && line.startsWith('Tokens:')) {
          currentBot.tokensStr = line.replace('Tokens:', '').trim();
        } else if (currentBot && line.startsWith('Cost:')) {
          currentBot.costStr = line.replace('Cost:', '').trim();
        }
      }
      
      if (mode === 'total') {
        if (line.startsWith('Total Input Tokens:')) {
          grandTotal.input = line.replace('Total Input Tokens:', '').trim();
        } else if (line.startsWith('Total Output Tokens:')) {
          grandTotal.output = line.replace('Total Output Tokens:', '').trim();
        } else if (line.startsWith('Total Tokens Used:')) {
          grandTotal.total = line.replace('Total Tokens Used:', '').trim();
        } else if (line.startsWith('Total Estimated Cost:')) {
          grandTotal.cost = line.replace('Total Estimated Cost:', '').trim();
        }
      }
    }
    
    return NextResponse.json({ success: true, text: stdout, parsed: { bots, grandTotal }, error: stderr });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
