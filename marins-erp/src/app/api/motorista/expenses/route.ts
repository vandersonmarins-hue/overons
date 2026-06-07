import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'expenses.json');

function read() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

export async function GET() {
  return NextResponse.json(read());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = read();
  const entry = {
    id: Date.now().toString(),
    driverName: body.driverName || 'João Motorista',
    type: body.type || 'other',
    value: body.value || 0,
    description: body.description || '',
    date: body.date || new Date().toISOString().split('T')[0],
    photoUrl: body.photoUrl || null,
    createdAt: new Date().toISOString(),
  };
  data.push(entry);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, id: entry.id });
}
