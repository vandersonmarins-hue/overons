export type RastreamentoStatus =
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADO'
  | 'EM_SEPARACAO'
  | 'SAIU_PARA_ENTREGA'
  | 'PROXIMO_CLIENTE'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'PROBLEMA_NA_ENTREGA';

export interface RastreamentoPedido {
  id: string;
  pedidoId: string;
  status: RastreamentoStatus;
  motorista: { nome: string; telefone: string; foto?: string } | null;
  clienteNome: string;
  clienteTelefone: string;
  enderecoCompleto: string;
  enderecoLat: number;
  enderecoLng: number;
  previsaoChegada: string;
  distanciaRestante: number;
  tempoRestante: number;
  ultimaAtualizacao: string;
  produtos: RastreamentoProduto[];
  historico: RastreamentoHistorico[];
}

export interface RastreamentoProduto {
  nome: string;
  quantidade: number;
  preco: number;
  imagemUrl?: string;
}

export interface RastreamentoHistorico {
  id: string;
  status: string;
  descricao: string;
  createdAt: string;
}

export interface LocalizacaoMotorista {
  latitude: number;
  longitude: number;
  velocidade: number;
  direcao: number;
  updatedAt: string;
}

export const STATUS_LABELS: Record<RastreamentoStatus, { label: string; icon: string; color: string }> = {
  AGUARDANDO_CONFIRMACAO: { label: 'Aguardando Confirmação', icon: '⏳', color: 'text-yellow-400' },
  CONFIRMADO: { label: 'Pedido Confirmado', icon: '✅', color: 'text-blue-400' },
  EM_SEPARACAO: { label: 'Em Separação', icon: '📦', color: 'text-blue-400' },
  SAIU_PARA_ENTREGA: { label: 'Saiu para Entrega', icon: '🚚', color: 'text-orange-400' },
  PROXIMO_CLIENTE: { label: 'Próximo de Você!', icon: '📍', color: 'text-green-400' },
  ENTREGUE: { label: 'Entregue', icon: '🎉', color: 'text-green-400' },
  CANCELADO: { label: 'Cancelado', icon: '❌', color: 'text-red-400' },
  PROBLEMA_NA_ENTREGA: { label: 'Problema na Entrega', icon: '⚠️', color: 'text-red-400' },
};

export const MOCK_PEDIDO: RastreamentoPedido = {
  id: '1',
  pedidoId: 'PED-2024-001',
  status: 'PROXIMO_CLIENTE',
  motorista: { nome: 'João Silva', telefone: '(11) 99999-0001', foto: 'https://ui-avatars.com/api/?name=João+Silva&background=3b82f6&color=fff' },
  clienteNome: 'Carlos Oliveira',
  clienteTelefone: '(11) 98888-0001',
  enderecoCompleto: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP',
  enderecoLat: -23.561,
  enderecoLng: -46.656,
  previsaoChegada: new Date(Date.now() + 15 * 60000).toISOString(),
  distanciaRestante: 3.2,
  tempoRestante: 15,
  ultimaAtualizacao: new Date().toISOString(),
  produtos: [
    { nome: 'Smartphone Galaxy S24', quantidade: 1, preco: 3999.00, imagemUrl: '' },
    { nome: 'Capa de Silicone', quantidade: 2, preco: 49.90 },
    { nome: 'Carregador Turbo', quantidade: 1, preco: 129.90 },
  ],
  historico: [
    { id: '1', status: 'CONFIRMADO', descricao: 'Pedido confirmado e pago', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: '2', status: 'EM_SEPARACAO', descricao: 'Produtos em separação no estoque', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: '3', status: 'SAIU_PARA_ENTREGA', descricao: 'Saiu para entrega', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() },
    { id: '4', status: 'PROXIMO_CLIENTE', descricao: 'Motorista está chegando', createdAt: new Date().toISOString() },
  ],
};

export const MOCK_LOCALIZACAO: LocalizacaoMotorista = {
  latitude: -23.555,
  longitude: -46.650,
  velocidade: 35,
  direcao: 180,
  updatedAt: new Date().toISOString(),
};
