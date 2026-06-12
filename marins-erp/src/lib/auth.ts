'use client';

export interface CompanySession {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    cnpj: string;
    plano?: string;
  };
}

export interface DriverSession {
  token: string;
  user: {
    id: string;
    nome: string;
    telefone?: string;
    empresa_id?: string;
  };
}

const COMPANY_KEY = 'overons_company_session';
const DRIVER_KEY = 'overons_driver_session';

export function getCompanySession(): CompanySession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCompanySession(session: CompanySession) {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(session));
}

export function clearCompanySession() {
  localStorage.removeItem(COMPANY_KEY);
}

export function getDriverSession(): DriverSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRIVER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDriverSession(session: DriverSession) {
  localStorage.setItem(DRIVER_KEY, JSON.stringify(session));
}

export function clearDriverSession() {
  localStorage.removeItem(DRIVER_KEY);
}
