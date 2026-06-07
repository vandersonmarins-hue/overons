'use client';

import { useState } from 'react';

const EXPENSE_TYPES = [
  { value: 'toll', label: '🏗️ Pedágio' },
  { value: 'parking', label: '🅿️ Estacionamento' },
  { value: 'meal', label: '🍽️ Alimentação' },
  { value: 'fuel', label: '⛽ Combustível' },
  { value: 'maintenance', label: '🔧 Manutenção' },
  { value: 'other', label: '📦 Outro' },
];

export default function ExpenseForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState('toll');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!value || parseFloat(value) <= 0) return alert('Informe o valor');
    setSaving(true);
    try {
      await fetch('/api/motorista/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverName: 'João Motorista', type, value: parseFloat(value), description, date: new Date().toISOString().split('T')[0] }),
      });
      setSaved(true);
      setTimeout(onClose, 1500);
    } catch { alert('Erro ao salvar'); }
    setSaving(false);
  };

  if (saved) return <div className="text-center text-green-400 font-bold py-8 text-lg">✅ Despesa registrada!</div>;

  return (
    <div>
      <p className="text-sm text-gray-300 mb-4">Preencha os dados da despesa:</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {EXPENSE_TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={`py-3 px-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${type === t.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'bg-gray-800 text-gray-300 border border-white/10 hover:bg-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">R$</span>
        <input value={value} onChange={e => setValue(e.target.value)} type="number" step="0.01" min="0" placeholder="0,00"
          className="w-full bg-gray-800 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-lg text-white font-bold placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
      </div>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (opcional)"
        className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 mb-5 focus:outline-none focus:border-blue-500/50" />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">Cancelar</button>
        <button onClick={save} disabled={saving || !value}
          className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-orange-900/30">
          {saving ? 'Salvando...' : '💰 Registrar'}
        </button>
      </div>
    </div>
  );
}
