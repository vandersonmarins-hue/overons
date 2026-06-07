import { NextResponse } from 'next/server';

export async function POST(req: Request, props: { params: Promise<{ pedidoId: string }> }) {
  const { pedidoId } = await props.params;
  const body = await req.json();
  await new Promise(r => setTimeout(r, 200));
  return NextResponse.json({
    success: true,
    message: 'Notificação enviada!',
    pedidoId,
    tipo: body.tipo || 'chegada',
  });
}
