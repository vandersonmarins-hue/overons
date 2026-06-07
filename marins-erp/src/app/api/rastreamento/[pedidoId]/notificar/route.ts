import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { pedidoId: string } }) {
  const body = await req.json();
  await new Promise(r => setTimeout(r, 200));
  return NextResponse.json({
    success: true,
    message: 'Notificação enviada!',
    pedidoId: params.pedidoId,
    tipo: body.tipo || 'chegada',
  });
}
