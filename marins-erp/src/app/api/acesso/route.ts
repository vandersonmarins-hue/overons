import { NextResponse } from 'next/server';
import { getEntregaByChave } from '@/lib/entregas';

// Registro de acessos
const acessosRegistrados = new Map();

export function getAcessosRegistrados() {
  return Array.from(acessosRegistrados.values());
}


// GET: listar acessos registrados
export async function GET() {
  return NextResponse.json({ acessos: getAcessosRegistrados(), total: acessosRegistrados.size });
}
export async function POST(req: Request) {
  const { chave } = await req.json();
  
  if (!chave) {
    return NextResponse.json({ valida: false, erro: 'Informe a chave de acesso' }, { status: 400 });
  }

  const chaveUpper = chave.toUpperCase().trim();
  const entrega = await getEntregaByChave(chaveUpper);
  
  if (!entrega) {
    return NextResponse.json({ valida: false, erro: 'Chave de acesso invalida' }, { status: 401 });
  }

  // Registra o acesso
  acessosRegistrados.set(chaveUpper, {
    chave: chaveUpper,
    pedidoId: entrega.pedidoId,
    cliente: entrega.cliente,
    primeiroAcesso: acessosRegistrados.get(chaveUpper)?.primeiroAcesso || new Date().toISOString(),
    ultimoAcesso: new Date().toISOString(),
  });

  return NextResponse.json({
    valida: true,
    pedidoId: entrega.pedidoId,
    cliente: entrega.cliente,
    mensagem: `Bem-vindo, ${entrega.cliente}!`,
  });
}
