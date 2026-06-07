'use client';

import { useEffect, useState } from 'react';
import { MapPin, Package, Clock, Route, AlertTriangle, Phone, MessageSquare, Camera, FileText, CheckCircle, XCircle, HelpCircle, Navigation, Wifi, WifiOff, Fuel, CreditCard, ListChecks, Bell, ChevronRight, User } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });

import 'leaflet/dist/leaflet.css';
import { useDriverStore } from './hooks/useDriverStore';
import type { Delivery, Message } from './types';

// ============================================================
// SEÇÃO 1: PAINEL PRINCIPAL (Summary Cards)
// ============================================================
function SummaryPanel() {
  const summary = useDriverStore((s) => s.summary);
  const cards = [
    { icon: Package, label: 'Entregas', value: `${summary.completedDeliveries}/${summary.totalDeliveries}`, color: 'bg-blue-500' },
    { icon: Route, label: 'KM Previstos', value: `${summary.kmForecast} km`, color: 'bg-green-500' },
    { icon: Clock, label: 'Término Previsto', value: summary.estimatedEndTime, color: 'bg-purple-500' },
    { icon: MapPin, label: 'Status', value: summary.completedDeliveries === summary.totalDeliveries ? '✅ Concluído' : '🔄 Em andamento', color: summary.completedDeliveries === summary.totalDeliveries ? 'bg-green-500' : 'bg-yellow-500' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className={`${c.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
            <c.icon className="text-white" size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{c.label}</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{c.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SEÇÃO 2: MAPA
// ============================================================
function RouteMap() {
  const deliveries = useDriverStore((s) => s.deliveries);
  const currentLocation = useDriverStore((s) => s.currentLocation);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        useDriverStore.getState().setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {}, { enableHighAccuracy: true });
    }
  }, []);

  const center = currentLocation || { lat: -23.561, lng: -46.656 };
  const waypoints = deliveries.filter(d => d.lat).map(d => [d.lat, d.lng] as [number, number]);

  if (!mounted) return <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">Carregando mapa...</div>;

  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
      <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-full w-full" zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {deliveries.filter(d => d.lat).map((d) => (
          <Marker key={d.id} position={[d.lat, d.lng]}>
            <Popup>
              <div className="font-semibold">{d.clientName}</div>
              <div className="text-xs text-gray-500">{d.address}</div>
              <div className="text-xs mt-1">⏰ {d.scheduledTime}</div>
            </Popup>
          </Marker>
        ))}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>📍 Sua localização</Popup>
          </Marker>
        )}
        {waypoints.length > 1 && <Polyline positions={waypoints} color="#3b82f6" weight={3} opacity={0.5} dashArray="8,8" />}
      </MapContainer>
      <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${deliveries[0]?.lat},${deliveries[0]?.lng}`, '_blank')}
        className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
        <Navigation size={16} /> Iniciar Navegação
      </button>
    </div>
  );
}

// ============================================================
// SEÇÃO 3: ENTREGA ATUAL
// ============================================================
function CurrentDelivery() {
  const deliveries = useDriverStore((s) => s.deliveries);
  const updateDeliveryStatus = useDriverStore((s) => s.updateDeliveryStatus);
  const current = deliveries.find(d => d.status === 'in_progress') || deliveries.find(d => d.status === 'pending');
  const [showModal, setShowModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Delivery['status'] | null>(null);
  const [notes, setNotes] = useState('');

  if (!current) return <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center text-gray-400">✅ Todas as entregas concluídas!</div>;

  const actions = [
    { status: 'delivered' as Delivery['status'], label: 'Entregue', icon: CheckCircle, color: 'bg-green-500 hover:bg-green-600' },
    { status: 'absent' as Delivery['status'], label: 'Cliente Ausente', icon: XCircle, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { status: 'refused' as Delivery['status'], label: 'Recusado', icon: HelpCircle, color: 'bg-red-500 hover:bg-red-600' },
    { status: 'problem' as Delivery['status'], label: 'Problema', icon: AlertTriangle, color: 'bg-orange-500 hover:bg-orange-600' },
  ];

  const handleAction = (status: Delivery['status']) => {
    setSelectedAction(status);
    setShowModal(true);
  };

  const confirmAction = () => {
    if (selectedAction) {
      updateDeliveryStatus(current.id, selectedAction, notes);
      setShowModal(false);
      setNotes('');
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-blue-500 font-semibold mb-1">📍 PRÓXIMA ENTREGA</div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{current.clientName}</h3>
            <p className="text-sm text-gray-500">{current.address}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Agendado</div>
            <div className="font-bold text-lg text-gray-900 dark:text-white">{current.scheduledTime}</div>
          </div>
        </div>
        {current.observations && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3 text-sm text-yellow-800 dark:text-yellow-200">
            📝 {current.observations}
          </div>
        )}
        {current.attempts.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Tentativas anteriores:</div>
            {current.attempts.map(a => (
              <div key={a.id} className="text-xs text-gray-500">• {new Date(a.timestamp).toLocaleTimeString()} - {a.status}{a.notes ? `: ${a.notes}` : ''}</div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {actions.map(a => (
            <button key={a.status} onClick={() => handleAction(a.status)}
              className={`${a.color} text-white py-3 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors`}>
              <a.icon size={16} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Confirmar Ação</h3>
            <p className="text-sm text-gray-500 mb-4">Registrar: <strong>{
              selectedAction === 'delivered' ? '✅ Entregue' :
              selectedAction === 'absent' ? '❌ Cliente Ausente' :
              selectedAction === 'refused' ? '🚫 Recusado' : '⚠️ Problema'
            }</strong></p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3} placeholder="Descreva o ocorrido..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { if (typeof window !== 'undefined') { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'; input.click(); } }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <Camera size={16} /> Foto
              </button>
              <button onClick={confirmAction}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// SEÇÃO 4: DOCUMENTOS
// ============================================================
function DocumentsPanel() {
  const docs = [
    { type: 'cte', label: 'CT-e', icon: FileText, status: 'valid' as const, color: 'text-green-500' },
    { type: 'mdfe', label: 'MDF-e', icon: FileText, status: 'valid' as const, color: 'text-green-500' },
    { type: 'nfe', label: 'NF-e', icon: FileText, status: 'pending' as const, color: 'text-yellow-500' },
    { type: 'insurance', label: 'Seguro', icon: FileText, status: 'valid' as const, color: 'text-green-500' },
  ];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><FileText size={18} className="text-blue-500" /> Documentos</h3>
      <div className="space-y-2">
        {docs.map(d => (
          <div key={d.type} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <d.icon className={d.color} size={20} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{d.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'valid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {d.status === 'valid' ? 'Válido' : 'Pendente'}
              </span>
            </div>
            <button className="text-blue-600 text-sm font-medium hover:underline">Visualizar</button>
          </div>
        ))}
      </div>
      <button className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
        <Camera size={16} className="inline mr-2" /> Digitalizar Documento
      </button>
    </div>
  );
}

// ============================================================
// SEÇÃO 5: COMUNICAÇÃO
// ============================================================
function CommunicationPanel() {
  const messages = useDriverStore((s) => s.messages);
  const addMessage = useDriverStore((s) => s.addMessage);
  const isOnline = useDriverStore((s) => s.isOnline);
  const [text, setText] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);

  const sendMessage = () => {
    if (!text.trim()) return;
    addMessage({ id: Date.now().toString(), sender: 'driver', text, timestamp: new Date().toISOString(), read: false });
    setText('');
  };

  const getSenderName = (s: Message['sender']) => s === 'central' ? 'Central' : s === 'client' ? 'Cliente' : s === 'support' ? 'Suporte' : 'Você';
  const getSenderColor = (s: Message['sender']) => s === 'central' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : s === 'client' ? 'bg-purple-100 text-purple-800' : s === 'support' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><MessageSquare size={18} className="text-blue-500" /> Chat</h3>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />} {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="h-40 overflow-y-auto mb-3 space-y-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${getSenderColor(m.sender)} rounded-lg px-3 py-2 text-sm`}>
                <div className="text-xs font-semibold opacity-70">{getSenderName(m.sender)}</div>
                <div>{m.text}</div>
                <div className="text-xs opacity-50 text-right mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Digite sua mensagem..." />
          <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Enviar</button>
        </div>
        <div className="flex gap-2 mt-3">
          {['Central', 'Cliente', 'Suporte'].map(label => (
            <button key={label} onClick={() => setText(`Olá ${label}! `)}
              className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-1">
              <Phone size={12} /> {label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowEmergency(true)}
          className="mt-3 w-full bg-red-600 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 animate-pulse">
          <AlertTriangle size={18} /> EMERGÊNCIA
        </button>
      </div>

      {showEmergency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowEmergency(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl text-center" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Confirmar Emergência</h3>
            <p className="text-sm text-gray-500 mb-4">Sua localização será compartilhada com a central imediatamente.</p>
            <button onClick={() => { setShowEmergency(false); window.open('tel:0800'); }}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold mb-2 hover:bg-red-700">📞 Ligar para Central</button>
            <button onClick={() => setShowEmergency(false)} className="text-sm text-gray-500 hover:underline">Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// BOTÕES FLUTUANTES
// ============================================================
function QuickButtons() {
  const [showChecklist, setShowChecklist] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const addExpense = useDriverStore((s) => s.expenses?.push);

  const items = [
    { icon: ListChecks, label: 'Checklist', color: 'bg-green-500', onClick: () => setShowChecklist(true) },
    { icon: CreditCard, label: 'Adiantamento', color: 'bg-blue-500', onClick: () => window.open('https://wa.me/5511999999999?text=SOLICITACAO_ADIANTAMENTO', '_blank') },
    { icon: Fuel, label: 'Despesa', color: 'bg-orange-500', onClick: () => setShowExpense(true) },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        {items.map(i => (
          <button key={i.label} onClick={i.onClick}
            className={`${i.color} w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform`}
            title={i.label}>
            <i.icon size={24} />
          </button>
        ))}
      </div>

      {showChecklist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowChecklist(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">📋 Checklist Diário</h3>
            {['Documentos', 'Combustível', 'Pneus', 'Luzes', 'Extintor'].map(item => (
              <label key={item} className="flex items-center gap-3 py-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </label>
            ))}
            <button onClick={() => setShowChecklist(false)} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium">Salvar</button>
          </div>
        </div>
      )}

      {showExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowExpense(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">💰 Registrar Despesa</h3>
            <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Pedágio</option><option>Estacionamento</option><option>Alimentação</option><option>Outro</option>
            </select>
            <input placeholder="Valor R$" type="number" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <button onClick={() => setShowExpense(false)} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">Registrar</button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function DriverPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-9 h-9 rounded-lg flex items-center justify-center">
              <Package className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg">Marins ERP</h1>
              <p className="text-xs text-gray-500">Painel do Motorista</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
              <User size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">João Motorista</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 py-4 pb-24">
        <SummaryPanel />

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <RouteMap />
          </div>
          <div>
            <CurrentDelivery />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <DocumentsPanel />
          <CommunicationPanel />
        </div>
      </main>

      <QuickButtons />
    </div>
  );
}
