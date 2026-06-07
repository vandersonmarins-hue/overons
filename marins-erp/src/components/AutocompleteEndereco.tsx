'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';

interface Sugestao {
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (endereco: string, lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
}

export default function AutocompleteEndereco({ value, onChange, onSelect, placeholder = 'Digite o endereco...', className = '' }: Props) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value || value.length < 4) { setSugestoes([]); setAberto(false); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&countrycodes=br`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        const data = await res.json();
        setSugestoes(data || []);
        setAberto(data?.length > 0);
      } catch {}
      setLoading(false);
    }, 400);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selecionar = (s: Sugestao) => {
    setAberto(false);
    onChange(s.display_name);
    if (onSelect) onSelect(s.display_name, parseFloat(s.lat), parseFloat(s.lon));
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-800 border border-white/10 rounded-xl pl-9 pr-8 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 ${className}`} />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
        {value && !loading && (
          <button onClick={() => { onChange(''); setSugestoes([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {aberto && sugestoes.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
          {sugestoes.map((s, i) => (
            <button key={i} onClick={() => selecionar(s)}
              className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-start gap-3 border-b border-white/5 last:border-0">
              <MapPin size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
