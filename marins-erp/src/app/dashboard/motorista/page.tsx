'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, MapPin, Bell, MessageSquare, FileText, CheckCircle, Fuel, CreditCard, ListChecks, TrendingUp, User, Navigation, Wifi, WifiOff, X, AlertTriangle, Phone, Camera, HelpCircle, Clock, Route } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
import 'leaflet/dist/leaflet.css';
import { useDriverStore } from './hooks/useDriverStore';
import ChecklistForm from './components/ChecklistForm';
import ExpenseForm from './components/ExpenseForm';

// ============================================================
// MENU SIDEBAR
// ============================================================
const MENU_ITEMS = [
  { id: 'map', icon: MapPin, label: 'Mapa da Rota' },
  { id: 'summary', icon: TrendingUp, label: 'Resumo do Dia' },
  { id: 'delivery', icon: Package, label: 'Entrega Atual' },
  { id: 'documents', icon: FileText, label: 'Documentos' },
  { id: 'chat', icon: MessageSquare, label: 'Comunicação' },
  { id: 'checklist', icon: ListChecks, label: 'Checklist Diário' },
  { id: 'expenses', icon: CreditCard, label: 'Despesas' },
];

export default function DriverPage() {
  const [section, setSection] = useState('map');
  const [menuOpen, setMenuOpen] = useState(false);
  const summary = useDriverStore((s) => s.summary);
  const deliveries = useDriverStore((s) => s.deliveries);
  const updateDeliveryStatus = useDriverStore((s) => s.updateDeliveryStatus);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const current = deliveries.find(d => d.status === 'in_progress') || deliveries.find(d => d.status === 'pending');

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => {}, { enableHighAccuracy: true });
    }
  }, []);

  const openSection = (id: string) => { setSection(id); setMenuOpen(false); };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 relative">
      {/* MAPA TELA CHEIA */}
      {mounted && (
        <div className="absolute inset-0 z-0">
          <MapContainer center={[currentLocation?.lat || -23.561, currentLocation?.lng || -46.656]} zoom={13} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {deliveries.filter(d => d.lat).map((d) => (
              <Marker key={d.id} position={[d.lat, d.lng]}>
                <Popup><div className="font-semibold text-sm">{d.clientName}</div><div className="text-xs text-gray-500">{d.address}</div></Popup>
              </Marker>
            ))}
            {currentLocation && <Marker position={[currentLocation.lat, currentLocation.lng]}><Popup>📍 Você</Popup></Marker>}
          </MapContainer>
          <button onClick={() => {
            if (current) window.open(`https://www.google.com/maps/dir/?api=1&destination=${current.lat},${current.lng}`, '_blank');
          }} className="absolute bottom-6 right-4 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 z-10">
            <Navigation size={18} /> Iniciar Navegação
          </button>
        </div>
      )}

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3">
        <button onClick={() => setMenuOpen(true)}
          className="w-11 h-11 bg-black/50 backdrop-blur rounded-xl flex flex-col items-center justify-center gap-1.5 border border-white/10">
          <span className="block w-5 h-0.5 bg-white rounded"></span>
          <span className="block w-5 h-0.5 bg-white rounded"></span>
          <span className="block w-5 h-0.5 bg-white rounded"></span>
        </button>
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur rounded-xl px-4 py-2 border border-white/10">
          <Package size={14} className="text-blue-400" />
          <span className="text-white text-sm font-medium">{summary.completedDeliveries}/{summary.totalDeliveries}</span>
          <span className="text-gray-400 text-xs">· {summary.kmForecast}km</span>
        </div>
      </div>

      {/* OVERLAY */}
      {menuOpen && <div className="absolute inset-0 bg-black/60 z-30" onClick={() => setMenuOpen(false)} />}

      {/* SIDEBAR */}
      <div className={`absolute top-0 left-0 bottom-0 w-72 bg-gray-900 z-40 transform transition-all duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center"><Package className="text-white" size={18} /></div>
            <div><h1 className="text-white font-bold text-base">Marins ERP</h1><p className="text-gray-400 text-xs">Painel do Motorista</p></div>
          </div>
          <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <nav className="p-3 space-y-1">
          {MENU_ITEMS.map(item => (
            <button key={item.id} onClick={() => openSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${section === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/5'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl">
            <User size={16} className="text-gray-400" />
            <span className="text-sm text-gray-300 flex-1">João Motorista</span>
            <div className="flex items-center gap-1 text-xs text-green-400"><Wifi size={10} /> Online</div>
          </div>
        </div>
      </div>

      {/* CONTEUDO DA SECAO */}
      {section !== 'map' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-5 animate-slide-up">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>

          {/* Resumo do Dia */}
          {section === 'summary' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📊 Resumo do Dia</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Package, label: 'Entregas', value: `${summary.completedDeliveries}/${summary.totalDeliveries}`, color: 'bg-blue-500' },
                  { icon: Route, label: 'KM Previstos', value: `${summary.kmForecast} km`, color: 'bg-green-500' },
                  { icon: Clock, label: 'Término', value: summary.estimatedEndTime, color: 'bg-purple-500' },
                  { icon: TrendingUp, label: 'Status', value: summary.completedDeliveries === summary.totalDeliveries ? 'Concluído' : 'Em andamento', color: summary.completedDeliveries === summary.totalDeliveries ? 'bg-green-500' : 'bg-yellow-500' },
                ].map(c => (
                  <div key={c.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className={`${c.color} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}><c.icon className="text-white" size={16} /></div>
                    <div className="text-white text-xl font-bold">{c.value}</div>
                    <div className="text-gray-400 text-xs">{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entrega Atual */}
          {section === 'delivery' && current && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📍 Entrega Atual</h2>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div><h3 className="text-white font-bold">{current.clientName}</h3><p className="text-gray-400 text-sm">{current.address}</p></div>
                  <div className="text-right"><div className="text-gray-400 text-xs">Agendado</div><div className="text-white font-bold text-lg">{current.scheduledTime}</div></div>
                </div>
                {current.observations && <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3 text-sm text-yellow-300">📝 {current.observations}</div>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { status: 'delivered' as const, label: 'Entregue', icon: CheckCircle, color: 'bg-green-500' },
                  { status: 'absent' as const, label: 'Ausente', icon: X, color: 'bg-yellow-500' },
                  { status: 'refused' as const, label: 'Recusado', icon: HelpCircle, color: 'bg-red-500' },
                  { status: 'problem' as const, label: 'Problema', icon: AlertTriangle, color: 'bg-orange-500' },
                ].map(a => (
                  <button key={a.status} onClick={() => updateDeliveryStatus(current.id, a.status)}
                    className={`${a.color} text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2`}>
                    <a.icon size={16} /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documentos */}
          {section === 'documents' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📄 Documentos</h2>
              {['CT-e', 'MDF-e', 'NF-e', 'Seguro'].map(doc => (
                <div key={doc} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10 mb-2">
                  <div className="flex items-center gap-3"><FileText size={18} className="text-blue-400" /><span className="text-white text-sm">{doc}</span><span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Válido</span></div>
                  <button className="text-blue-400 text-sm">Ver</button>
                </div>
              ))}
              <button className="w-full mt-3 py-3 border-2 border-dashed border-white/10 rounded-xl text-sm text-gray-400"><Camera size={16} className="inline mr-2" /> Digitalizar</button>
            </div>
          )}

          {/* Chat / Comunicação */}
          {section === 'chat' && <ChatSection />}

          {/* Checklist */}
          {section === 'checklist' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📋 Checklist Diário</h2>
              <ChecklistForm onClose={() => setSection('map')} />
            </div>
          )}

          {/* Despesas */}
          {section === 'expenses' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">💰 Despesas</h2>
              <ExpenseForm onClose={() => setSection('map')} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CHAT SECTION
// ============================================================
function ChatSection() {
  const messages = useDriverStore((s) => s.messages);
  const addMessage = useDriverStore((s) => s.addMessage);
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    addMessage({ id: Date.now().toString(), sender: 'driver', text, timestamp: new Date().toISOString(), read: false });
    setText('');
  };

  return (
    <div>
      <h2 className="text-white font-bold text-lg mb-4">💬 Comunicação</h2>
      <div className="h-48 overflow-y-auto mb-3 space-y-2 bg-black/20 rounded-xl p-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.sender === 'driver' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200'}`}>
              <div className="text-xs opacity-70 mb-0.5">{m.sender === 'central' ? 'Central' : m.sender === 'client' ? 'Cliente' : 'Você'}</div>
              <div>{m.text}</div>
              <div className="text-xs opacity-50 text-right mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500" placeholder="Digite sua mensagem..." />
        <button onClick={send} className="bg-blue-600 text-white px-5 rounded-xl text-sm font-medium">Enviar</button>
      </div>
      <div className="flex gap-2 mt-3">
        {['Central', 'Cliente', 'Suporte'].map(label => (
          <button key={label} onClick={() => setText(`Olá ${label}! `)}
            className="flex-1 py-2 border border-white/10 rounded-xl text-xs text-gray-400 hover:bg-white/5 flex items-center justify-center gap-1">
            <Phone size={12} /> {label}
          </button>
        ))}
      </div>
      <button className="mt-3 w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700">
        <AlertTriangle size={18} /> EMERGÊNCIA
      </button>
    </div>
  );
}
