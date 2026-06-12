import { NextResponse } from 'next/server';
import { overonsApi } from '@/lib/overons';

export async function POST(req: Request, props: { params: Promise<{ pedidoId: string }> }) {
  const { pedidoId } = await props.params;
  const body = await req.json();
  await overonsApi(`/api/entregas/${pedidoId}/status`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'concluida',
      feedbackCliente: body.feedback || '',
    }),
  });
  return NextResponse.json({
    success: true,
    message: 'Recebimento confirmado com sucesso!',
    data: { pedidoId, confirmadoEm: new Date().toISOString(), feedback: body.feedback || '' },
  });
}
