import { NextResponse } from 'next/server';
import { getEntregaByPedidoId, mapEntregaToTracking } from '@/lib/entregas';

export async function GET(req: Request, props: { params: Promise<{ pedidoId: string }> }) {
  const { pedidoId } = await props.params;
  const entrega = await getEntregaByPedidoId(pedidoId);
  if (!entrega) {
    return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 });
  }
  return NextResponse.json(mapEntregaToTracking(entrega));
}
