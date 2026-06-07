import { NextResponse } from 'next/server';

const motoristas: any[] = [];

export async function POST(req: Request) {
  const body = await req.json();
  const { nome, cpf, cnh, cnhCategoria, telefone, email, endereco, dataNascimento, observacoes, documentos } = body;

  if (!nome || !cpf) {
    return NextResponse.json({ erro: 'Nome e CPF sao obrigatorios' }, { status: 400 });
  }

  const motorista = {
    id: 'MOT-' + Date.now().toString(36).toUpperCase(),
    nome,
    cpf: cpf.replace(/\D/g, ''),
    cnh: cnh || '',
    cnhCategoria: cnhCategoria || '',
    telefone: telefone || '',
    email: email || '',
    endereco: endereco || '',
    dataNascimento: dataNascimento || '',
    observacoes: observacoes || '',
    documentos: documentos || [],
    status: 'disponivel',
    criadoEm: new Date().toISOString(),
  };

  motoristas.push(motorista);
  return NextResponse.json({ success: true, id: motorista.id, message: 'Motorista cadastrado!' });
}

export async function GET() {
  return NextResponse.json(motoristas);
}
