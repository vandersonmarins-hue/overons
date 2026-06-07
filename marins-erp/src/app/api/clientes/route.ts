import { NextResponse } from 'next/server';

const clientes: any[] = [];

export async function POST(req: Request) {
  const body = await req.json();
  const { tipo, nome, documento, email, telefone, endereco, contatoNome, observacoes, documentos } = body;

  if (!nome || !documento) {
    return NextResponse.json({ erro: 'Nome e documento sao obrigatorios' }, { status: 400 });
  }

  const cliente = {
    id: Date.now().toString(),
    tipo: tipo || 'fisica', // 'fisica' | 'juridica'
    nome,
    documento,
    email: email || '',
    telefone: telefone || '',
    endereco: endereco || '',
    contatoNome: contatoNome || '',
    observacoes: observacoes || '',
    documentos: documentos || [],
    criadoEm: new Date().toISOString(),
  };

  clientes.push(cliente);
  return NextResponse.json({ success: true, id: cliente.id, message: 'Cliente cadastrado!' });
}

export async function GET() {
  return NextResponse.json(clientes);
}
