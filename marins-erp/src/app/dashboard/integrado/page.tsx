'use client';

import { useState, useEffect } from 'react';
import { Package, Clock, Route, TrendingUp, User, Wifi, X, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
import 'leaflet/dist/leaflet.css';
import { overonsApi } from '@/lib/overons';

interface OveronsDriver {
  id: string; nome: string; status: string; latitude: number; longitude: number; ultimaAtualizacao: string; entregasHoje: number;
}

export default function DriverIntegratedPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [section, setSection] = useState('map');
  const [drivers, setDrivers] = useState<OveronsDriver[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const load = async () => {
      try {
        const [d, k] = await Promise.all([
          overonsApi('/api/drivers'),
          overonsApi('/api/kpis'),
        ]);
        setDrivers(d || []);
        setKpis(k || {});
      } catch {}
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const me = drivers.find(d => d.nome?.toLowerCase().includes('joão')) || drivers[0] || { id: 'DEV', nome: 'Motorista Dev', status: 'online', latitude: -23.561, longitude: -46.656, entregasHoje: 0 };

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      {/* MAPA */}
      {mounted && (
        <div className="absolute inset-0 z-0">
          <MapContainer center={[me.latitude || -23.561, me.longitude || -46.656]} zoom={13} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {me.latitude && <Marker position={[me.latitude, me.longitude]}><Popup>📍 {me.nome}</Popup></Marker>}
          </MapContainer>
        </div>
      )}

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3">
        <button onClick={() => setMenuOpen(true)}
          className="w-11 h-11 bg-gray-900/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-1.5 border border-white/20 shadow-lg">
          <span className="block w-5 h-0.5 bg-white rounded"></span>
          <span className="block w-5 h-0.5 bg-white rounded"></span>
          <span className="block w-5 h-0.5 bg-white rounded"></span>
        </button>
        <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20 shadow-lg">
          <Package size={14} className="text-blue-400" />
          <span className="text-white text-sm font-bold">{kpis?.entregasHoje?.valor || 0}</span>
          <span className="text-blue-300 text-xs">· {drivers.length} online</span>
        </div>
      </div>

      {menuOpen && <div className="absolute inset-0 bg-black/60 z-30" onClick={() => setMenuOpen(false)} />}

      {/* SIDEBAR */}
      <div className={`absolute top-0 left-0 bottom-0 w-72 bg-gray-950 z-40 transform transition-all duration-300 ease-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-10 h-10 rounded-xl flex items-center justify-center"><Package className="text-white" size={20} /></div>
            <div><h1 className="text-white font-bold text-base">Overons One</h1><p className="text-gray-400 text-xs">Painel Integrado</p></div>
          </div>
          <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <nav className="p-3 space-y-1">
          {[
            { id: 'map', icon: MapPin, label: 'Mapa' },
            { id: 'summary', icon: TrendingUp, label: 'Resumo' },
            { id: 'drivers', icon: User, label: 'Motoristas' },
          ].map(item => (
            <button key={item.id} onClick={() => { setSection(item.id); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium ${section === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* PAINEL */}
      {section !== 'map' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-gray-950/95 backdrop-blur-xl border-t border-white/10 p-5">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>

          {section === 'summary' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📊 Resumo (Overons)</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Entregas Hoje', value: kpis?.entregasHoje?.valor || 0, sub: kpis?.entregasHoje?.vsOntem ? `${kpis.entregasHoje.vsOntem}% vs ontem` : '', color: 'from-blue-500 to-blue-600' },
                  { label: 'Pontualidade', value: `${kpis?.taxaPontualidade?.valor || 0}%`, sub: '', color: 'from-green-500 to-green-600' },
                  { label: 'Sucesso 1ª Tentativa', value: `${kpis?.sucessoPrimeiraTentativa?.valor || 0}%`, sub: '', color: 'from-purple-500 to-purple-600' },
                  { label: 'Motoristas', value: `${kpis?.motoristasOnline || 0}/${kpis?.motoristasTotal || 0}`, sub: 'online/total', color: 'from-yellow-500 to-orange-500' },
                ].map(c => (
                  <div key={c.label} className="bg-gray-800/80 rounded-xl p-4 border border-white/10">
                    <div className={`bg-gradient-to-br ${c.color} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
                      <Package className="text-white" size={16} />
                    </div>
                    <div className="text-white text-xl font-bold">{c.value}</div>
                    <div className="text-gray-400 text-xs">{c.label}</div>
                    {c.sub && <div className="text-gray-500 text-xs mt-0.5">{c.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'drivers' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">🚚 Motoristas Online</h2>
              {drivers.length === 0 ? (
                <div className="text-gray-500 text-center py-8">Nenhum motorista online</div>
              ) : (
                <div className="space-y-2">
                  {drivers.map(d => (
                    <div key={d.id} className="flex items-center gap-3 bg-gray-800/80 rounded-xl p-3 border border-white/10">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {d.nome?.charAt(0) || 'M'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm">{d.nome || d.id}</div>
                        <div className="text-gray-400 text-xs">{d.entregasHoje || 0} entregas · {d.status}</div>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${d.status === 'online' ? 'bg-green-400 shadow-green-400/50 shadow-lg' : 'bg-gray-600'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
