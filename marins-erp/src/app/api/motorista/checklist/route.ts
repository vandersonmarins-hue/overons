import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'checklists.json');

function read() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

export async function GET() {
  const data = read();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = read();
  const entry = {
    id: Date.now().toString(),
    driverName: body.driverName || 'João Motorista',
    date: body.date || new Date().toISOString().split('T')[0],
    items: body.items || [],
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
  };
  data.push(entry);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, id: entry.id });
}
