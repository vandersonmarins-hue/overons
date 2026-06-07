import { NextResponse } from 'next/server';
import { MOCK_PEDIDO } from '@/types/rastreamento';

export async function GET(req: Request, { params }: { params: { pedidoId: string } }) {
  await new Promise(r => setTimeout(r, 100));
  return NextResponse.json(MOCK_PEDIDO.historico);
}
