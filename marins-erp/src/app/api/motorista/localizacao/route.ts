import { NextResponse } from 'next/server';

// Em memória: armazena últimas localizações
const localizacoes: any[] = [];
const clientesAcompanhando = new Map<string, Set<string>>();

export async function POST(req: Request) {
  const body = await req.json();
  const { pedidoId, latitude, longitude, velocidade, direcao } = body;

  const entry = {
    motoristaId: 'motorista_1',
    pedidoId: pedidoId || null,
    latitude,
    longitude,
    velocidade: velocidade || 0,
    direcao: direcao || 0,
    createdAt: new Date().toISOString(),
  };

  localizacoes.push(entry);
  if (localizacoes.length > 1000) localizacoes.shift();

  // Atualiza contagem de clientes acompanhando
  if (pedidoId) {
    if (!clientesAcompanhando.has(pedidoId)) clientesAcompanhando.set(pedidoId, new Set());
  }

  return NextResponse.json({
    success: true,
    clientesAcompanhando: pedidoId ? (clientesAcompanhando.get(pedidoId)?.size || 0) : 0,
    motoristasAtivos: new Set(localizacoes.map(l => l.motoristaId)).size,
  });
}

export async function GET() {
  const ultimas = new Map<string, any>();
  for (const loc of localizacoes) {
    ultimas.set(loc.motoristaId, loc);
  }
  return NextResponse.json({
    motoristas: Array.from(ultimas.values()).slice(-50),
    total: ultimas.size,
  });
}
