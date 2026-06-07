'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Save, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getPermissoes, salvarPermissoes, logoutMaster, isMaster, type Permissoes } from '@/lib/permissoes';

const MODULOS: { key: keyof Permissoes; label: string; desc: string }[] = [
  { key: 'central', label: 'Central de Monitoramento', desc: 'Visão geral das entregas em andamento' },
  { key: 'clientes', label: 'Clientes', desc: 'Lista e cadastro de clientes' },
  { key: 'transportadores', label: 'Transportadores', desc: 'Lista e cadastro de motoristas' },
  { key: 'analiseDocumentos', label: 'Análise de Documentos', desc: 'Aprovação/recusa de cadastros' },
  { key: 'novaEntrega', label: 'Nova Entrega', desc: 'Cadastrar novas entregas' },
  { key: 'relatorios', label: 'Relatórios', desc: 'Relatórios da frota' },
  { key: 'rastreamento', label: 'Rastreamento (Cliente)', desc: 'Acesso do cliente ao rastreamento' },
  { key: 'configuracoes', label: 'Configurações', desc: 'Este painel de configurações' },
];

export default function ConfiguracoesPage() {
  const [perm, setPerm] = useState<Permissoes>(getPermissoes());
  const [salvo, setSalvo] = useState(false);
  const admin = isMaster();

  const toggle = (key: keyof Permissoes) => {
    setPerm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const salvar = () => {
    salvarPermissoes(perm);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/central" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
          <Shield size={20} className="text-blue-400" />
          <h1 className="text-white font-bold text-lg">Configurações</h1>
        </div>
        {admin && (
          <button onClick={() => { logoutMaster(); window.location.href = '/central'; }}
            className="text-red-400 text-sm flex items-center gap-1 hover:text-red-300">
            <LogOut size={14} /> Sair
          </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Acesso Master */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">🔐 Acesso Master</h2>
          <div className="bg-blue-600/10 rounded-xl p-4 border border-blue-500/20 text-sm">
            {admin ? (
              <p className="text-blue-400">✅ Você está logado como <strong>Administrador Master</strong>. Todos os módulos estão liberados.</p>
            ) : (
              <p className="text-yellow-400">⚠️ Modo restrito. Apenas módulos permitidos estão visíveis.</p>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-3">Senha master: <code className="bg-gray-800 px-2 py-0.5 rounded text-blue-400">overons2024</code></p>
        </div>

        {/* Permissões */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">👁️ Controle de Módulos</h2>
            <span className="text-xs text-gray-500">Mostrar/Ocultar telas</span>
          </div>

          {!admin && (
            <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20 text-yellow-300 text-xs mb-4">
              ⚠️ Apenas o administrador master pode alterar as permissões.
            </div>
          )}

          <div className="space-y-2">
            {MODULOS.map(mod => (
              <div key={mod.key} className="flex items-center justify-between bg-gray-800/80 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-3">
                  <button onClick={() => admin && toggle(mod.key)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${perm[mod.key] ? 'bg-blue-600' : 'bg-gray-700'} ${!admin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${perm[mod.key] ? 'left-6' : 'left-1'}`} />
                  </button>
                  <div>
                    <div className="text-white text-sm font-medium">{mod.label}</div>
                    <div className="text-gray-500 text-xs">{mod.desc}</div>
                  </div>
                </div>
                <div className="text-gray-500">
                  {perm[mod.key] ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-red-400" />}
                </div>
              </div>
            ))}
          </div>

          {admin && (
            <button onClick={salvar} disabled={salvo}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={16} /> {salvo ? '✅ Salvo!' : 'Salvar Permissões'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
