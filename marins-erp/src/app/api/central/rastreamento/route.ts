import { NextResponse } from 'next/server';
import { MOCK_PEDIDO } from '@/types/rastreamento';

const mockPedidos = [
  { ...MOCK_PEDIDO, pedidoId: 'PED-001', status: 'SAIU_PARA_ENTREGA' as const, clienteNome: 'Mercado Bom Preço', enderecoCompleto: 'Av. Paulista, 1000, São Paulo', enderecoLat: -23.561, enderecoLng: -46.656, tempoRestante: 25, distanciaRestante: 5.2 },
  { ...MOCK_PEDIDO, pedidoId: 'PED-002', status: 'PROXIMO_CLIENTE' as const, clienteNome: 'Farmácia Saúde', enderecoCompleto: 'Rua Augusta, 500, São Paulo', enderecoLat: -23.557, enderecoLng: -46.659, tempoRestante: 8, distanciaRestante: 1.5 },
  { ...MOCK_PEDIDO, pedidoId: 'PED-003', status: 'EM_SEPARACAO' as const, clienteNome: 'Restaurante Sabor do Chef', enderecoCompleto: 'Rua Oscar Freire, 200, São Paulo', enderecoLat: -23.565, enderecoLng: -46.668, tempoRestante: 45, distanciaRestante: 12.0 },
  { ...MOCK_PEDIDO, pedidoId: 'PED-004', status: 'ENTREGUE' as const, clienteNome: 'Papelaria Escola', enderecoCompleto: 'Rua da Consolação, 700, São Paulo', enderecoLat: -23.551, enderecoLng: -46.660, tempoRestante: 0, distanciaRestante: 0 },
];

export async function GET() {
  const resumo = {
    total: mockPedidos.length,
    emRota: mockPedidos.filter(p => p.status === 'SAIU_PARA_ENTREGA').length,
    proximoCliente: mockPedidos.filter(p => p.status === 'PROXIMO_CLIENTE').length,
    entregue: mockPedidos.filter(p => p.status === 'ENTREGUE').length,
    separacao: mockPedidos.filter(p => p.status === 'EM_SEPARACAO').length,
    tempoMedio: 28, // minutos
  };
  return NextResponse.json({ resumo, pedidos: mockPedidos });
}
