'use client';

import { useState } from 'react';

const ITEMS = [
  { key: 'documents', label: 'Documentos (CNH, CRLV)' },
  { key: 'fuel', label: 'Combustível' },
  { key: 'tires', label: 'Pneus' },
  { key: 'lights', label: 'Luzes' },
  { key: 'fireExtinguisher', label: 'Extintor' },
  { key: 'oil', label: 'Óleo' },
  { key: 'brakes', label: 'Freios' },
  { key: 'cleanliness', label: 'Limpeza do Veículo' },
];

export default function ChecklistForm({ onClose }: { onClose: () => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/motorista/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: 'João Motorista',
          date: new Date().toISOString().split('T')[0],
          items: ITEMS.filter(i => checked[i.key]).map(i => i.label),
          notes,
        }),
      });
      setSaved(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      alert('Erro ao salvar checklist');
    }
    setSaving(false);
  };

  if (saved) return <div className="text-center text-green-600 py-8">✅ Checklist salvo com sucesso!</div>;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">Marque os itens verificados:</p>
      <div className="space-y-2 mb-4">
        {ITEMS.map(item => (
          <label key={item.key} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 -mx-2">
            <input type="checkbox" checked={!!checked[item.key]} onChange={() => toggle(item.key)} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
          </label>
        ))}
      </div>
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        rows={2} placeholder="Observações..." />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400">Cancelar</button>
        <button onClick={save} disabled={saving}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar Checklist'}
        </button>
      </div>
    </div>
  );
}
