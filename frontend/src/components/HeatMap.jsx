import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function getColor(driver) {
  if (!driver?.latitude) return '#636e72';
  if (driver.status === 'offline') return '#636e72';
  return '#00b894';
}

function createIcon(color, hasDelivery) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;
      background:${color};
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 12px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:14px;color:#fff;
    ">${hasDelivery ? '📦' : '🚚'}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export default function HeatMap({ drivers }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, { zoomControl: false })
      .setView([-23.5505, -46.6333], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance.current);
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !drivers) return;
    const map = mapInstance.current;
    const markers = markersRef.current;
    const active = new Set();

    drivers.forEach(d => {
      if (!d.latitude || !d.longitude) return;
      active.add(d.id);
      const color = getColor(d);
      const icon = createIcon(color, d.entregasHoje > 0);

      if (markers[d.id]) {
        markers[d.id].setLatLng([d.latitude, d.longitude]);
        markers[d.id].setIcon(icon);
      } else {
        const m = L.marker([d.latitude, d.longitude], { icon }).addTo(map);
        m.bindPopup(`
          <div style="font-family:Arial;min-width:180px;">
            <b style="color:#16213e;">🚚 ${d.nome || d.id}</b><br/>
            <span style="color:#666;">${d.status === 'online' ? '🟢 Online' : '⚪ Offline'}</span><br/>
            📦 ${d.entregasHoje || 0} entregas<br/>
            🕐 ${d.ultimaAtualizacao ? new Date(d.ultimaAtualizacao).toLocaleTimeString() : '—'}
          </div>
        `);
        markers[d.id] = m;
      }
    });

    // Cleanup stale markers
    Object.keys(markers).forEach(id => {
      if (!active.has(id) && markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
      }
    });

    // Fit bounds if any drivers
    const activeMarkers = Object.values(markers);
    if (activeMarkers.length > 0) {
      const group = L.featureGroup(activeMarkers);
      map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 15 });
    }
  }, [drivers]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '12px' }} />;
}
