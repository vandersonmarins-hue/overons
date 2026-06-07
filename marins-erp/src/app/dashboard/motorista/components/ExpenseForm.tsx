'use client';

import { useState } from 'react';

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
        body: JSON.stringify({
          driverName: 'João Motorista',
          type,
          value: parseFloat(value),
          description,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      setSaved(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      alert('Erro ao salvar despesa');
    }
    setSaving(false);
  };

  if (saved) return <div className="text-center text-green-600 py-8">✅ Despesa registrada!</div>;

  return (
    <div>
      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">💰 Registrar Despesa</h3>
      <select value={type} onChange={e => setType(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
        <option value="toll">Pedágio</option>
        <option value="parking">Estacionamento</option>
        <option value="meal">Alimentação</option>
        <option value="fuel">Combustível</option>
        <option value="maintenance">Manutenção</option>
        <option value="other">Outro</option>
      </select>
      <input value={value} onChange={e => setValue(e.target.value)} placeholder="Valor R$" type="number" step="0.01" min="0"
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (opcional)"
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-4 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400">Cancelar</button>
        <button onClick={save} disabled={saving || !value}
          className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Salvando...' : 'Registrar'}
        </button>
      </div>
    </div>
  );
}
