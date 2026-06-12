import type {
  LocalizacaoMotorista,
  RastreamentoHistorico,
  RastreamentoPedido,
  RastreamentoStatus,
} from '@/types/rastreamento';
import type { Delivery, DeliveryStatus } from '@/app/dashboard/motorista/types';
import { overonsApi } from './overons';

export interface OveronsEntrega {
  id: string;
  pedidoId: string;
  chaveAcesso: string;
  cliente: string;
  endereco: string;
  produtos?: Array<{ nome: string; quantidade: number; preco: number }>;
  observacoes?: string;
  origem?: string;
  distanciaKm?: number;
  tempoMin?: number;
  destinoLat?: number | null;
  destinoLng?: number | null;
  ocultarCliente?: boolean;
  tipoVeiculo?: string;
  precoViagem?: number;
  status: string;
  criadaEm: string;
  entregadorId?: string;
  entregadorNome?: string;
  ultimaLatitude?: number | null;
  ultimaLongitude?: number | null;
  ultimaAtualizacaoLocalizacao?: string | null;
  historico?: RastreamentoHistorico[];
  feedbackCliente?: string;
  notaCliente?: number;
}

const ORIGEM_PADRAO = {
  lat: -23.5505,
  lng: -46.6333,
};

const telefoneMotoristaPadrao = '(11) 99999-0000';

export function mapOveronsStatusToTrackingStatus(status: string): RastreamentoStatus {
  switch (status) {
    case 'pendente':
      return 'AGUARDANDO_CONFIRMACAO';
    case 'aceita':
      return 'CONFIRMADO';
    case 'em_andamento':
      return 'SAIU_PARA_ENTREGA';
    case 'PROXIMO_CLIENTE':
      return 'PROXIMO_CLIENTE';
    case 'concluida':
      return 'ENTREGUE';
    case 'problema':
      return 'PROBLEMA_NA_ENTREGA';
    case 'cancelada':
    case 'recusada':
      return 'CANCELADO';
    default:
      return 'AGUARDANDO_CONFIRMACAO';
  }
}

export function mapOveronsStatusToDriverStatus(status: string): DeliveryStatus {
  switch (status) {
    case 'aceita':
      return 'pending';
    case 'em_andamento':
    case 'PROXIMO_CLIENTE':
      return 'in_progress';
    case 'concluida':
      return 'delivered';
    case 'ausente':
      return 'absent';
    case 'recusada':
      return 'refused';
    case 'problema':
      return 'problem';
    default:
      return 'pending';
  }
}

export function mapEntregaToDriverDelivery(entrega: OveronsEntrega, index: number): Delivery {
  return {
    id: entrega.pedidoId,
    order: index + 1,
    clientName: entrega.cliente,
    address: entrega.endereco,
    lat: typeof entrega.destinoLat === 'number' ? entrega.destinoLat : ORIGEM_PADRAO.lat,
    lng: typeof entrega.destinoLng === 'number' ? entrega.destinoLng : ORIGEM_PADRAO.lng,
    scheduledTime: buildScheduledTime(entrega),
    observations: entrega.observacoes || '',
    status: mapOveronsStatusToDriverStatus(entrega.status),
    attempts: [],
    documents: [],
  };
}

export function mapEntregaToTracking(entrega: OveronsEntrega): RastreamentoPedido {
  const trackingStatus = mapOveronsStatusToTrackingStatus(entrega.status);
  const tempoRestante = Math.max(0, Number(entrega.tempoMin || estimateTempoByStatus(entrega.status)));
  const previsaoChegada = new Date(Date.now() + tempoRestante * 60000).toISOString();

  return {
    id: entrega.id,
    pedidoId: entrega.pedidoId,
    status: trackingStatus,
    motorista: entrega.entregadorNome
      ? {
          nome: entrega.entregadorNome,
          telefone: telefoneMotoristaPadrao,
        }
      : null,
    clienteNome: entrega.cliente,
    clienteTelefone: '(11) 98888-0001',
    enderecoCompleto: entrega.endereco,
    enderecoLat: typeof entrega.destinoLat === 'number' ? entrega.destinoLat : ORIGEM_PADRAO.lat,
    enderecoLng: typeof entrega.destinoLng === 'number' ? entrega.destinoLng : ORIGEM_PADRAO.lng,
    previsaoChegada,
    distanciaRestante: Number(entrega.distanciaKm || estimateDistanceByStatus(entrega.status)),
    tempoRestante,
    ultimaAtualizacao: entrega.ultimaAtualizacaoLocalizacao || entrega.criadaEm,
    produtos: entrega.produtos || [],
    historico: entrega.historico || [],
  };
}

export function mapEntregaToLocalizacao(entrega: OveronsEntrega): LocalizacaoMotorista {
  return {
    latitude: typeof entrega.ultimaLatitude === 'number' ? entrega.ultimaLatitude : ORIGEM_PADRAO.lat,
    longitude: typeof entrega.ultimaLongitude === 'number' ? entrega.ultimaLongitude : ORIGEM_PADRAO.lng,
    velocidade: 0,
    direcao: 0,
    updatedAt: entrega.ultimaAtualizacaoLocalizacao || entrega.criadaEm,
  };
}

export async function getEntregaByPedidoId(pedidoId: string): Promise<OveronsEntrega | null> {
  try {
    return await overonsApi(`/api/entregas/${pedidoId}`);
  } catch {
    return null;
  }
}

export async function getEntregaByChave(chave: string): Promise<OveronsEntrega | null> {
  try {
    return await overonsApi(`/api/entregas/chave/${encodeURIComponent(chave)}`);
  } catch {
    return null;
  }
}

export async function getEntregas(): Promise<OveronsEntrega[]> {
  try {
    const data = await overonsApi('/api/entregas');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function buildScheduledTime(entrega: OveronsEntrega) {
  const base = entrega.criadaEm ? new Date(entrega.criadaEm) : new Date();
  return base.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function estimateTempoByStatus(status: string) {
  if (status === 'PROXIMO_CLIENTE') return 5;
  if (status === 'em_andamento') return 20;
  if (status === 'aceita') return 35;
  if (status === 'concluida') return 0;
  return 45;
}

function estimateDistanceByStatus(status: string) {
  if (status === 'PROXIMO_CLIENTE') return 1.2;
  if (status === 'em_andamento') return 6.5;
  if (status === 'aceita') return 10;
  if (status === 'concluida') return 0;
  return 12;
}
