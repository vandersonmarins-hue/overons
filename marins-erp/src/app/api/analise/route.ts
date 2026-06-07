import { NextResponse } from 'next/server';

// Analise de documentos
export async function PUT(req: Request) {
  const body = await req.json();
  const { motoristaId, acao, motivo } = body; // acao: 'aprovar' | 'recusar'

  if (!motoristaId || !acao) {
    return NextResponse.json({ erro: 'motoristaId e acao obrigatorios' }, { status: 400 });
  }

  // Busca o motorista na API de cadastro
  try {
    const res = await fetch('http://localhost:3001/api/motoristas-cadastro');
    const motoristas = await res.json();
    const idx = motoristas.findIndex((m: any) => m.id === motoristaId);
    
    if (idx === -1) {
      return NextResponse.json({ erro: 'Motorista nao encontrado' }, { status: 404 });
    }

    // Atualiza via POST (simula update - em producao seria um PUT real)
    if (acao === 'aprovar') {
      motoristas[idx].status = 'aprovado';
      motoristas[idx].motivoRecusa = '';
    } else {
      motoristas[idx].status = 'recusado';
      motoristas[idx].motivoRecusa = motivo || 'Documentacao incompleta';
    }

    return NextResponse.json({
      success: true,
      message: acao === 'aprovar' ? 'Motorista aprovado!' : 'Motorista recusado.',
      motorista: motoristas[idx],
    });
  } catch {
    return NextResponse.json({ erro: 'Erro ao processar analise' }, { status: 500 });
  }
}
