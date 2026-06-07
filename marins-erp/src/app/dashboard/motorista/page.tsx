'use client';

import { useState, useEffect } from 'react';
import { Package, MapPin, Bell, MessageSquare, FileText, CheckCircle, Fuel, CreditCard, ListChecks, TrendingUp, User, Navigation, Wifi, WifiOff, X, AlertTriangle, Phone, Camera, HelpCircle, Clock, Route } from 'lucide-react';
import MapaGoogle from '@/components/MapaGoogle';

// Origem fixa (centro de distribuicao)
const ORIGEM = { lat: -23.5505, lng: -46.6333, nome: 'Centro de Distribuicao' };
import { useDriverStore } from './hooks/useDriverStore';
import ChecklistForm from './components/ChecklistForm';
import ExpenseForm from './components/ExpenseForm';

const MENU_ITEMS = [
  { id: 'map', icon: MapPin, label: 'Mapa da Rota' },
  { id: 'summary', icon: TrendingUp, label: 'Resumo do Dia' },
  { id: 'delivery', icon: Package, label: 'Entrega Atual' },
  { id: 'documents', icon: FileText, label: 'Documentos' },
  { id: 'chat', icon: MessageSquare, label: 'Comunicação' },
  { id: 'checklist', icon: ListChecks, label: 'Checklist' },
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      {/* MAPA FULLSCREEN */}
      {mounted && (
        <div className="absolute inset-0 z-0">
          <MapaGoogle
            origemLat={ORIGEM.lat}
            origemLng={ORIGEM.lng}
            origemNome={ORIGEM.nome}
            destinos={deliveries.filter(d => d.lat).map(d => ({ id: d.id, lat: d.lat, lng: d.lng, nome: d.clientName, endereco: d.address, horario: d.scheduledTime }))}
            motoristaLat={currentLocation?.lat}
            motoristaLng={currentLocation?.lng}
          />
          <button onClick={() => { if (current) window.open(`https://www.google.com/maps/dir/?api=1&destination=${current.lat},${current.lng}`, '_blank'); }}
            className="absolute bottom-6 right-4 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 z-10 shadow-blue-900/50 hover:bg-blue-700 active:scale-95 transition-all">
            <Navigation size={18} /> Navegar
          </button>
        </div>
      )}

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3">
        <button onClick={() => setMenuOpen(true)}
          className="w-11 h-11 bg-gray-900/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-1.5 border border-white/20 shadow-lg active:scale-95 transition-all">
          <span className="block w-5 h-0.5 bg-white rounded"></span>
          <span className="block w-5 h-0.5 bg-white rounded"></span>
          <span className="block w-5 h-0.5 bg-white rounded"></span>
        </button>
        <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20 shadow-lg">
          <Package size={14} className="text-blue-400" />
          <span className="text-white text-sm font-bold">{summary.completedDeliveries}/{summary.totalDeliveries}</span>
          <span className="text-blue-300 text-xs">· {summary.kmForecast}km</span>
        </div>
      </div>

      {/* OVERLAY */}
      {menuOpen && <div className="absolute inset-0 bg-black/60 z-30" onClick={() => setMenuOpen(false)} />}

      {/* SIDEBAR */}
      <div className={`absolute top-0 left-0 bottom-0 w-72 bg-gray-950 z-40 transform transition-all duration-300 ease-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><Package className="text-white" size={20} /></div>
            <div><h1 className="text-white font-bold text-base">Marins ERP</h1><p className="text-gray-400 text-xs">Painel do Motorista</p></div>
          </div>
          <button onClick={() => setMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <nav className="p-3 space-y-1">
          {MENU_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setSection(item.id); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${section === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center"><User size={14} className="text-white" /></div>
            <span className="text-sm text-gray-200 font-medium flex-1">João Motorista</span>
            <div className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20"><Wifi size={10} /> Online</div>
          </div>
        </div>
      </div>

      {/* PAINEL INFERIOR (SLIDE-UP) */}
      {section !== 'map' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-gray-950/95 backdrop-blur-xl border-t border-white/10 p-5 shadow-2xl animate-slide-up">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>

          {/* RESUMO */}
          {section === 'summary' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📊 Resumo do Dia</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Package, label: 'Entregas', value: `${summary.completedDeliveries}/${summary.totalDeliveries}`, color: 'from-blue-500 to-blue-600', desc: `${summary.totalDeliveries - summary.completedDeliveries} restantes` },
                  { icon: Route, label: 'KM Previstos', value: `${summary.kmForecast} km`, color: 'from-green-500 to-green-600', desc: 'Rota do dia' },
                  { icon: Clock, label: 'Término', value: summary.estimatedEndTime, color: 'from-purple-500 to-purple-600', desc: 'Previsão' },
                  { icon: TrendingUp, label: 'Status', value: summary.completedDeliveries === summary.totalDeliveries ? '✅ FEITO' : '🔄 ROTA', color: summary.completedDeliveries === summary.totalDeliveries ? 'from-green-500 to-green-600' : 'from-yellow-500 to-orange-500', desc: summary.completedDeliveries === summary.totalDeliveries ? 'Parabéns!' : `${summary.completedDeliveries} entregues` },
                ].map(c => (
                  <div key={c.label} className="bg-gray-800/80 rounded-xl p-4 border border-white/10">
                    <div className={`bg-gradient-to-br ${c.color} w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-lg`}><c.icon className="text-white" size={18} /></div>
                    <div className="text-white text-xl font-bold">{c.value}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{c.label}</div>
                    <div className="text-gray-500 text-xs">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ENTREGA ATUAL */}
          {section === 'delivery' && current && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📍 Entrega Atual</h2>
              <div className="bg-gray-800/80 rounded-xl p-5 border border-white/10 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-blue-400 text-xs font-semibold mb-1">PRÓXIMA ENTREGA</div>
                    <h3 className="text-white font-bold text-lg">{current.clientName}</h3>
                    <p className="text-gray-300 text-sm mt-0.5">{current.address}</p>
                  </div>
                  <div className="text-right bg-gray-900/80 rounded-xl px-4 py-2">
                    <div className="text-gray-400 text-xs">Agendado</div>
                    <div className="text-white font-bold text-xl">{current.scheduledTime}</div>
                  </div>
                </div>
                {current.observations && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-2 text-sm text-yellow-300 flex items-start gap-2">
                    <span>📝</span> <span>{current.observations}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateDeliveryStatus(current.id, 'delivered')} className="bg-green-600 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-900/30"><CheckCircle size={18} /> Entregue</button>
                <button onClick={() => updateDeliveryStatus(current.id, 'absent')} className="bg-yellow-600 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-yellow-700 active:scale-95 transition-all"><X size={18} /> Ausente</button>
                <button onClick={() => updateDeliveryStatus(current.id, 'refused')} className="bg-red-600 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all"><HelpCircle size={18} /> Recusado</button>
                <button onClick={() => updateDeliveryStatus(current.id, 'problem')} className="bg-orange-600 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-95 transition-all"><AlertTriangle size={18} /> Problema</button>
              </div>
            </div>
          )}

          {/* DOCUMENTOS */}
          {section === 'documents' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📄 Documentos do Veículo</h2>
              {[
                { name: 'CT-e', status: 'Válido', color: 'text-green-400', bg: 'bg-green-500/10' },
                { name: 'MDF-e', status: 'Válido', color: 'text-green-400', bg: 'bg-green-500/10' },
                { name: 'NF-e', status: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                { name: 'Seguro', status: 'Válido', color: 'text-green-400', bg: 'bg-green-500/10' },
              ].map(doc => (
                <div key={doc.name} className="flex items-center justify-between bg-gray-800/80 rounded-xl p-4 border border-white/10 mb-2">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-400" />
                    <div>
                      <div className="text-white font-medium text-sm">{doc.name}</div>
                      <span className={`text-xs ${doc.color} ${doc.bg} px-2 py-0.5 rounded-full mt-1 inline-block`}>{doc.status}</span>
                    </div>
                  </div>
                  <button className="text-blue-400 text-sm font-medium hover:text-blue-300">Visualizar</button>
                </div>
              ))}
              <button className="w-full mt-3 py-4 border-2 border-dashed border-white/10 rounded-xl text-sm text-gray-400 hover:border-blue-500/50 hover:text-blue-400 transition-all flex items-center justify-center gap-2"><Camera size={18} /> Digitalizar Documento</button>
            </div>
          )}

          {/* CHAT */}
          {section === 'chat' && <ChatSection />}

          {/* CHECKLIST */}
          {section === 'checklist' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">📋 Checklist Diário</h2>
              <ChecklistForm onClose={() => setSection('map')} />
            </div>
          )}

          {/* DESPESAS */}
          {section === 'expenses' && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">💰 Registrar Despesa</h2>
              <ExpenseForm onClose={() => setSection('map')} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CHAT
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
      <div className="h-52 overflow-y-auto mb-3 space-y-3 bg-gray-900/60 rounded-xl p-3 border border-white/5">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.sender === 'driver' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-800 text-gray-200 rounded-bl-md border border-white/10'}`}>
              <div className="text-xs font-semibold opacity-70 mb-1">{m.sender === 'central' ? 'Central' : m.sender === 'client' ? 'Cliente' : m.sender === 'support' ? 'Suporte' : 'Você'}</div>
              <div>{m.text}</div>
              <div className="text-xs opacity-50 text-right mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" placeholder="Digite sua mensagem..." />
        <button onClick={send} className="bg-blue-600 text-white px-5 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all">Enviar</button>
      </div>
      <div className="flex gap-2 mt-3">
        {[
          { label: 'Central', icon: Phone },
          { label: 'Cliente', icon: Phone },
          { label: 'Suporte', icon: Phone },
        ].map(item => (
          <button key={item.label} onClick={() => setText(`Olá ${item.label}! `)}
            className="flex-1 py-3 bg-gray-800 border border-white/10 rounded-xl text-xs text-gray-300 hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center gap-2 font-medium">
            <item.icon size={14} className="text-blue-400" /> {item.label}
          </button>
        ))}
      </div>
      <button className="mt-4 w-full bg-red-600 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-900/30">
        <AlertTriangle size={18} /> EMERGÊNCIA
      </button>
    </div>
  );
}
