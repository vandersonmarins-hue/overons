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

export default function ChecklistForm({ onClose, theme = 'dark' }: { onClose: () => void; theme?: 'dark' | 'light' }) {
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
    } catch { alert('Erro ao salvar'); }
    setSaving(false);
  };

  if (saved) return <div className="text-center text-green-400 font-bold py-8 text-lg">✅ Checklist salvo!</div>;

  return (
    <div>
      <p className="text-sm text-gray-300 mb-4">Marque os itens verificados hoje:</p>
      <div className="space-y-1 mb-5">
        {ITEMS.map(item => (
          <label key={item.key} className="flex items-center gap-3 py-3 px-3 rounded-xl cursor-pointer bg-gray-800/50 border border-white/5 hover:bg-gray-700/50 transition-colors">
            <input type="checkbox" checked={!!checked[item.key]} onChange={() => toggle(item.key)}
              className="w-5 h-5 rounded-lg text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-200 font-medium">{item.label}</span>
          </label>
        ))}
      </div>
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        className="w-full bg-gray-800 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 mb-4 focus:outline-none focus:border-blue-500/50"
        rows={2} placeholder="Observações (opcional)..." />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">Cancelar</button>
        <button onClick={save} disabled={saving}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30">
          {saving ? 'Salvando...' : '✅ Salvar Checklist'}
        </button>
      </div>
    </div>
  );
}
