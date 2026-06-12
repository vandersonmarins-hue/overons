import { create } from 'zustand';
import type { Delivery, Message, DriverChecklist, Expense, DriverSummary } from '../types';

const MOCK_MESSAGES: Message[] = [
  { id: '1', sender: 'central', text: 'Bom dia! Confirme sua localização atual.', timestamp: '2024-01-15T07:00:00', read: true },
  { id: '2', sender: 'driver', text: 'Bom dia! Estou na Av. Paulista, iniciando a rota.', timestamp: '2024-01-15T07:05:00', read: true },
  { id: '3', sender: 'client', text: 'Olá, estou aguardando a entrega. Chegou?', timestamp: '2024-01-15T08:15:00', read: false },
];

interface DriverState {
  summary: DriverSummary;
  deliveries: Delivery[];
  messages: Message[];
  checklist: DriverChecklist;
  expenses: Expense[];
  isOnline: boolean;
  currentLocation: { lat: number; lng: number } | null;
  profile: { id: string; nome: string } | null;
  setOnline: (v: boolean) => void;
  setDeliveries: (deliveries: Delivery[]) => void;
  setProfile: (profile: { id: string; nome: string } | null) => void;
  updateDeliveryStatus: (id: string, status: Delivery['status'], notes?: string, photoUrl?: string) => void;
  addMessage: (msg: Message) => void;
  markMessagesAsRead: (ids?: string[]) => void;
  setCurrentLocation: (loc: { lat: number; lng: number }) => void;
}

function buildSummary(deliveries: Delivery[]): DriverSummary {
  const completedDeliveries = deliveries.filter((delivery) => delivery.status === 'delivered').length;
  const activeDeliveries = deliveries.filter((delivery) => delivery.status === 'pending' || delivery.status === 'in_progress').length;

  return {
    totalDeliveries: deliveries.length,
    completedDeliveries,
    kmForecast: activeDeliveries * 8,
    estimatedEndTime: activeDeliveries > 0
      ? new Date(Date.now() + activeDeliveries * 45 * 60000).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--',
    nextDelivery: deliveries.find((delivery) => delivery.status === 'in_progress') || deliveries.find((delivery) => delivery.status === 'pending'),
  };
}

export const useDriverStore = create<DriverState>((set) => ({
  summary: {
    totalDeliveries: 0,
    completedDeliveries: 0,
    kmForecast: 0,
    estimatedEndTime: '--:--',
  },
  deliveries: [],
  messages: MOCK_MESSAGES,
  checklist: { date: new Date().toISOString().split('T')[0], documents: true, fuel: true, tires: true, completed: true },
  expenses: [],
  isOnline: true,
  currentLocation: null,
  profile: null,
  setOnline: (v) => set({ isOnline: v }),
  setProfile: (profile) => set({ profile }),
  setDeliveries: (deliveries) =>
    set({
      deliveries,
      summary: buildSummary(deliveries),
    }),
  updateDeliveryStatus: (id, status, notes, photoUrl) =>
    set((state) => {
      const updatedDeliveries = state.deliveries.map((delivery) =>
        delivery.id === id
          ? {
              ...delivery,
              status,
              attempts: [
                ...delivery.attempts,
                { id: Date.now().toString(), timestamp: new Date().toISOString(), status, notes, photoUrl },
              ],
            }
          : delivery
      );

      return {
        deliveries: updatedDeliveries,
        summary: buildSummary(updatedDeliveries),
      };
    }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  markMessagesAsRead: (ids) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.sender === 'central' && (!ids || ids.includes(message.id))
          ? { ...message, read: true }
          : message
      ),
    })),
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
}));
