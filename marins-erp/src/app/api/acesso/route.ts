import { NextResponse } from 'next/server';

// MOCK: chaves de acesso (em producao viria do banco)
const CHAVES = new Map([
  ['MAR-2024-001', { pedidoId: 'PED-2024-001', cliente: 'Carlos Oliveira', validaAte: '2026-12-31' }],
  ['MAR-2024-002', { pedidoId: 'PED-2024-001', cliente: 'Maria Souza', validaAte: '2026-12-31' }],
  ['DEMO-123', { pedidoId: 'PED-2024-001', cliente: 'Cliente Demonstracao', validaAte: '2026-12-31' }],
]);

export async function POST(req: Request) {
  const { chave } = await req.json();
  
  if (!chave) {
    return NextResponse.json({ valida: false, erro: 'Informe a chave de acesso' }, { status: 400 });
  }

  const dados = CHAVES.get(chave.toUpperCase().trim());
  
  if (!dados) {
    return NextResponse.json({ valida: false, erro: 'Chave de acesso invalida' }, { status: 401 });
  }

  const validaAte = new Date(dados.validaAte);
  if (validaAte < new Date()) {
    return NextResponse.json({ valida: false, erro: 'Chave de acesso expirada' }, { status: 401 });
  }

  return NextResponse.json({
    valida: true,
    pedidoId: dados.pedidoId,
    cliente: dados.cliente,
    mensagem: `Bem-vindo, ${dados.cliente}!`,
  });
}
