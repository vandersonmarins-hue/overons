import { NextResponse } from 'next/server';

const motoristas: any[] = [];

export async function POST(req: Request) {
  const body = await req.json();
  const { nome, cpf, cnh, cnhCategoria, tipoVeiculo, tipoContrato, telefone, email, endereco, dataNascimento, observacoes, documentos, certidoes } = body;

  if (!nome || !cpf) {
    return NextResponse.json({ erro: 'Nome e CPF sao obrigatorios' }, { status: 400 });
  }

  const motorista = {
    id: 'MOT-' + Date.now().toString(36).toUpperCase(),
    nome,
    cpf: cpf.replace(/\D/g, ''),
    cnh: cnh || '',
    cnhCategoria: cnhCategoria || '',
    tipoVeiculo: tipoVeiculo || '',
    tipoContrato: tipoContrato || 'autonomo',
    telefone: telefone || '',
    email: email || '',
    endereco: endereco || '',
    dataNascimento: dataNascimento || '',
    observacoes: observacoes || '',
    documentos: documentos || [],
    certidoes: certidoes || {},
    status: 'pendente', // pendente | aprovado | recusado
    motivoRecusa: '',
    criadoEm: new Date().toISOString(),
  };

  motoristas.push(motorista);
  return NextResponse.json({ success: true, id: motorista.id, message: 'Cadastro enviado para análise! Acompanhe seu email.' });
}

export async function GET() {
  return NextResponse.json(motoristas);
}
