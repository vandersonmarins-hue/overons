import { NextResponse } from 'next/server';
import { MOCK_PEDIDO } from '@/types/rastreamento';

export async function GET(req: Request, props: { params: Promise<{ pedidoId: string }> }) {
  const { pedidoId } = await props.params;
  await new Promise(r => setTimeout(r, 200));
  return NextResponse.json({ ...MOCK_PEDIDO, pedidoId });
}
