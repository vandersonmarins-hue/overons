import { NextResponse } from 'next/server';
import { MOCK_LOCALIZACAO } from '@/types/rastreamento';

export async function GET(req: Request, { params }: { params: { pedidoId: string } }) {
  await new Promise(r => setTimeout(r, 100));
  // Simula movimento do motorista
  const offset = (Math.random() - 0.5) * 0.01;
  return NextResponse.json({
    ...MOCK_LOCALIZACAO,
    latitude: MOCK_LOCALIZACAO.latitude + offset,
    longitude: MOCK_LOCALIZACAO.longitude + offset,
    updatedAt: new Date().toISOString(),
  });
}
