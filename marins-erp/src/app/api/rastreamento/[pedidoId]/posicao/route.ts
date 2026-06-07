import { NextResponse } from 'next/server';
import { MOCK_LOCALIZACAO } from '@/types/rastreamento';

export async function GET(req: Request, props: { params: Promise<{ pedidoId: string }> }) {
  await props.params;
  await new Promise(r => setTimeout(r, 100));
  const offset = (Math.random() - 0.5) * 0.01;
  return NextResponse.json({
    ...MOCK_LOCALIZACAO,
    latitude: MOCK_LOCALIZACAO.latitude + offset,
    longitude: MOCK_LOCALIZACAO.longitude + offset,
    updatedAt: new Date().toISOString(),
  });
}
