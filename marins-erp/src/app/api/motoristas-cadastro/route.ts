import { NextResponse } from 'next/server';
const OVERONS_URL = process.env.OVERONS_API_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  const body = await req.json();
  const response = await fetch(`${OVERONS_URL}/api/entregadores/cadastro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET() {
  const response = await fetch(`${OVERONS_URL}/api/entregadores`);
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
