'use client';

// Sistema simples de permissoes usando localStorage
// EM PRODUCAO: substituir por autenticacao real (JWT, banco, etc)

const STORAGE_KEY = 'overons_permissoes';
const MASTER_KEY = 'overons_master';

export interface Permissoes {
  central: boolean;
  clientes: boolean;
  transportadores: boolean;
  analiseDocumentos: boolean;
  novaEntrega: boolean;
  relatorios: boolean;
  rastreamento: boolean;
  configuracoes: boolean;
}

const DEFAULT_PERMISSOES: Permissoes = {
  central: true,
  clientes: true,
  transportadores: true,
  analiseDocumentos: true,
  novaEntrega: true,
  relatorios: true,
  rastreamento: false,
  configuracoes: false,
};

export function getPermissoes(): Permissoes {
  if (typeof window === 'undefined') return DEFAULT_PERMISSOES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_PERMISSOES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PERMISSOES;
}

export function salvarPermissoes(p: Permissoes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function isMaster(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MASTER_KEY) === 'true';
}

export function loginMaster(senha: string): boolean {
  const MASTER_PASSWORD = 'overons2024';
  if (senha === MASTER_PASSWORD) {
    localStorage.setItem(MASTER_KEY, 'true');
    return true;
  }
  return false;
}

export function logoutMaster() {
  localStorage.removeItem(MASTER_KEY);
}

export function verificarPermissao(modulo: keyof Permissoes): boolean {
  if (isMaster()) return true;
  return getPermissoes()[modulo];
}
