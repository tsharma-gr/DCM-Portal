/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { targetDate } = await request.json();
    
    const vpsUrl = "https://139-59-191-27.nip.io";
    const SECRET_TOKEN = "tv_queue_master_secret_2026_xyz987";
    
    const response = await fetch(vpsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SECRET_TOKEN}`
      },
      body: JSON.stringify({ action: "get_tokens", targetDate }),
      cache: "no-store"
    });
    
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch tokens from VPS');
    }
    
    const stdout = data.output || '';
    
    // Parse the output string into structured JSON
    const lines = stdout.split('\n');
    let grandTotal: any = null;
    const bots: any[] = [];
    
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
    
    return NextResponse.json({ success: true, text: stdout, parsed: { bots, grandTotal } });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
