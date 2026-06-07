import { NextResponse } from 'next/server';

// Em memoria: armazena entregas cadastradas
const entregas: any[] = [];

export async function POST(req: Request) {
  const body = await req.json();
  const { cliente, endereco, produtos, observacoes } = body;
  
  if (!cliente || !endereco) {
    return NextResponse.json({ erro: 'Cliente e endereco sao obrigatorios' }, { status: 400 });
  }

  const pedidoId = 'PED-' + Date.now().toString(36).toUpperCase();
  const chaveAcesso = 'MAR-' + Date.now().toString(36).toUpperCase().slice(0, 8);

  const novaEntrega = {
    id: Date.now().toString(),
    pedidoId,
    chaveAcesso,
    cliente,
    endereco,
    produtos: produtos || [],
    observacoes: observacoes || '',
    status: 'AGUARDANDO_CONFIRMACAO',
    criadaEm: new Date().toISOString(),
    motorista: null as string | null,
  };

  entregas.push(novaEntrega);

  return NextResponse.json({
    success: true,
    pedidoId,
    chaveAcesso,
    mensagem: `Entrega ${pedidoId} cadastrada! Chave do cliente: ${chaveAcesso}`,
  });
}

export async function GET() {
  return NextResponse.json(entregas.slice(-50).reverse());
}
