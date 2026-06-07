import { NextResponse } from 'next/server';

export async function POST(req: Request, props: { params: Promise<{ pedidoId: string }> }) {
  const { pedidoId } = await props.params;
  const body = await req.json();
  await new Promise(r => setTimeout(r, 300));
  return NextResponse.json({
    success: true,
    message: 'Recebimento confirmado com sucesso!',
    data: { pedidoId, confirmadoEm: new Date().toISOString(), feedback: body.feedback || '' },
  });
}
