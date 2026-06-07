import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { pedidoId: string } }) {
  const body = await req.json();
  await new Promise(r => setTimeout(r, 300));
  return NextResponse.json({
    success: true,
    message: 'Recebimento confirmado com sucesso!',
    data: { pedidoId: params.pedidoId, confirmadoEm: new Date().toISOString(), feedback: body.feedback || '' },
  });
}
