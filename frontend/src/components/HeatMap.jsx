import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function getColor(driver) {
  if (!driver?.latitude) return '#636e72';
  if (driver.status === 'offline') return '#636e72';
  return '#00b894';
}

function createIcon(color, hasDelivery, index) {
  const num = index !== undefined ? index + 1 : '';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;
      background:${color};
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 12px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;color:#fff;font-weight:bold;
    ">${num || (hasDelivery ? '📦' : '🚚')}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// Gerar dados simulados de entrega para o popup
function gerarInfoEntrega(driver) {
  const entregasHoje = driver.entregasHoje || Math.floor(Math.random() * 8) + 2;
  const kmMedio = (6 + Math.random() * 14).toFixed(1);
  const tempoMedio = Math.floor(Math.random() * 45) + 15;
  const distanciaTotal = (entregasHoje * parseFloat(kmMedio)).toFixed(1);
  const tempoTotal = entregasHoje * tempoMedio;
  const ordem = Array.from({ length: Math.min(entregasHoje, 5) }, (_, i) => `📍 Parada ${i + 1}: Rua ${String.fromCharCode(65 + i)}, ${Math.floor(Math.random() * 500) + 100}`);
  
  return { entregasHoje, kmMedio, tempoMedio, distanciaTotal, tempoTotal, ordem };
}

export default function HeatMap({ drivers, deliveryLog }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const routesRef = useRef([]);

  useEffect(() => {
    if (mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([-23.5505, -46.6333], 13);
    // OpenStreetMap standard - mostra construcoes em zoom 16+
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstance.current);
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(mapInstance.current);
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !drivers) return;
    const map = mapInstance.current;
    const markers = markersRef.current;
    const active = new Set();

    // Limpar rotas anteriores
    routesRef.current.forEach(r => map.removeLayer(r));
    routesRef.current = [];

    drivers.forEach((d, driverIndex) => {
      if (!d.latitude || !d.longitude) return;
      active.add(d.id);
      const color = getColor(d);
      const info = gerarInfoEntrega(d);
      const icon = createIcon(color, d.entregasHoje > 0, driverIndex);

      if (markers[d.id]) {
        markers[d.id].setLatLng([d.latitude, d.longitude]);
        markers[d.id].setIcon(icon);
      } else {
        const m = L.marker([d.latitude, d.longitude], { icon }).addTo(map);

        // Popup com informacoes detalhadas
        const ordemHtml = info.ordem.map(o => `<div style="font-size:11px;padding:1px 0;">${o}</div>`).join('');
        m.bindPopup(`
          <div style="font-family:Arial;min-width:220px;max-width:280px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:14px;">${driverIndex + 1}</div>
              <div>
                <b style="color:#16213e;font-size:15px;">${d.nome || d.id}</b><br>
                <span style="color:#666;font-size:12px;">${d.status === 'online' ? '🟢 Online' : '⚪ Offline'}</span>
              </div>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;font-size:12px;">
              <div style="background:#f0f0f0;padding:6px 8px;border-radius:6px;">
                <span style="color:#888;">📦 Entregas</span><br>
                <b style="font-size:16px;">${info.entregasHoje}</b>
              </div>
              <div style="background:#f0f0f0;padding:6px 8px;border-radius:6px;">
                <span style="color:#888;">📏 KM Total</span><br>
                <b style="font-size:16px;">${info.distanciaTotal} km</b>
              </div>
              <div style="background:#f0f0f0;padding:6px 8px;border-radius:6px;">
                <span style="color:#888;">⏱️ Tempo Médio</span><br>
                <b style="font-size:14px;">${info.tempoMedio} min</b>
              </div>
              <div style="background:#f0f0f0;padding:6px 8px;border-radius:6px;">
                <span style="color:#888;">⛽ KM/L Médio</span><br>
                <b style="font-size:14px;">${info.kmMedio}</b>
              </div>
            </div>
            
            <div style="font-size:11px;color:#888;margin-bottom:4px;"><b>📍 Rota do dia:</b></div>
            <div style="background:#f8f8f8;border-radius:6px;padding:6px 8px;">
              ${ordemHtml}
            </div>
            
            <div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:6px;">
              🕐 Última atualização: ${d.ultimaAtualizacao ? new Date(d.ultimaAtualizacao).toLocaleTimeString() : '—'}
            </div>
          </div>
        `, { maxWidth: 300, minWidth: 200 });
        
        markers[d.id] = m;
      }

      // Desenhar rota simulated (linha poligonal)
      if (d.latitude && d.longitude) {
        const pontosRota = [
          [-23.5505, -46.6333], // Centro SP
          [d.latitude, d.longitude],
        ];
        // Adicionar pontos intermediarios simulados
        for (let i = 0; i < 3; i++) {
          const midLat = -23.5505 + (d.latitude + 23.5505) * ((i + 1) / 4) + (Math.random() - 0.5) * 0.02;
          const midLng = -46.6333 + (d.longitude + 46.6333) * ((i + 1) / 4) + (Math.random() - 0.5) * 0.02;
          pontosRota.splice(1 + i, 0, [midLat, midLng]);
        }

        const routeLine = L.polyline(pontosRota, {
          color: color,
          weight: 3,
          opacity: 0.4,
          dashArray: '8, 8',
        }).addTo(map);
        routesRef.current.push(routeLine);
      }
    });

    // Cleanup stale markers
    Object.keys(markers).forEach(id => {
      if (!active.has(id) && markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
      }
    });

    // Fit bounds
    const todosMarkers = Object.values(markers);
    if (todosMarkers.length > 0) {
      const group = L.featureGroup(todosMarkers);
      map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 16 });
    }
  }, [drivers, deliveryLog]);

  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}
