export type DeliveryStatus = 'pending' | 'in_progress' | 'delivered' | 'absent' | 'refused' | 'problem';

export interface Delivery {
  id: string;
  order: number;
  clientName: string;
  address: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  observations?: string;
  status: DeliveryStatus;
  attempts: DeliveryAttempt[];
  documents: Document[];
}

export interface DeliveryAttempt {
  id: string;
  timestamp: string;
  status: DeliveryStatus;
  photoUrl?: string;
  notes?: string;
}

export interface Document {
  id: string;
  type: 'cte' | 'mdfe' | 'nfe' | 'insurance';
  label: string;
  url?: string;
  status: 'valid' | 'pending' | 'expired';
}

export interface Message {
  id: string;
  sender: 'driver' | 'central' | 'client' | 'support';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface DriverChecklist {
  date: string;
  documents: boolean;
  fuel: boolean;
  tires: boolean;
  completed: boolean;
}

export interface Expense {
  id: string;
  type: 'toll' | 'parking' | 'meal' | 'other';
  value: number;
  description: string;
  date: string;
  photoUrl?: string;
}

export interface DriverSummary {
  totalDeliveries: number;
  completedDeliveries: number;
  kmForecast: number;
  estimatedEndTime: string;
  nextDelivery?: Delivery;
}
