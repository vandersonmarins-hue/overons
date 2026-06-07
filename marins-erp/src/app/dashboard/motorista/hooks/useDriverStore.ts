import { create } from 'zustand';
import type { Delivery, Message, DriverChecklist, Expense, DriverSummary } from '../types';

const MOCK_DELIVERIES: Delivery[] = [
  { id: '1', order: 1, clientName: 'Mercado Bom Preço', address: 'Av. Paulista, 1000, São Paulo', lat: -23.561, lng: -46.656, scheduledTime: '08:30', observations: 'Entregar no depósito', status: 'in_progress', attempts: [], documents: [] },
  { id: '2', order: 2, clientName: 'Farmácia Saúde', address: 'Rua Augusta, 500, São Paulo', lat: -23.557, lng: -46.659, scheduledTime: '09:15', status: 'pending', attempts: [], documents: [] },
  { id: '3', order: 3, clientName: 'Restaurante Sabor do Chef', address: 'Rua Oscar Freire, 200, São Paulo', lat: -23.565, lng: -46.668, scheduledTime: '10:00', status: 'pending', attempts: [], documents: [] },
  { id: '4', order: 4, clientName: 'Papelaria Escola', address: 'Rua da Consolação, 700, São Paulo', lat: -23.551, lng: -46.660, scheduledTime: '10:45', observations: 'Campainha quebrada, ligar ao chegar', status: 'pending', attempts: [], documents: [] },
  { id: '5', order: 5, clientName: 'Academia Fit', address: 'Av. Faria Lima, 1500, São Paulo', lat: -23.571, lng: -46.688, scheduledTime: '13:00', status: 'pending', attempts: [], documents: [] },
];

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
  setOnline: (v: boolean) => void;
  updateDeliveryStatus: (id: string, status: Delivery['status'], notes?: string, photoUrl?: string) => void;
  addMessage: (msg: Message) => void;
  setCurrentLocation: (loc: { lat: number; lng: number }) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  summary: {
    totalDeliveries: 8,
    completedDeliveries: 1,
    kmForecast: 120,
    estimatedEndTime: '14:30',
  },
  deliveries: MOCK_DELIVERIES,
  messages: MOCK_MESSAGES,
  checklist: { date: new Date().toISOString().split('T')[0], documents: true, fuel: true, tires: true, completed: true },
  expenses: [],
  isOnline: navigator.onLine,
  currentLocation: null,
  setOnline: (v) => set({ isOnline: v }),
  updateDeliveryStatus: (id, status, notes, photoUrl) =>
    set((s) => ({
      deliveries: s.deliveries.map((d) =>
        d.id === id
          ? {
              ...d,
              status,
              attempts: [
                ...d.attempts,
                { id: Date.now().toString(), timestamp: new Date().toISOString(), status, notes, photoUrl },
              ],
            }
          : d
      ),
      summary: {
        ...s.summary,
        completedDeliveries:
          status === 'delivered' ? s.summary.completedDeliveries + 1 : s.summary.completedDeliveries,
      },
    })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
}));
