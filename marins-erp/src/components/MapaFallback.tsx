'use client';

import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue (client-side only)
if (typeof window !== 'undefined') {
  // @ts-ignore
  import('leaflet').then(L => {
    // @ts-ignore
    delete L.default.Icon.Default.prototype._getIconUrl;
    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  });
}

interface Props {
  origemLat?: number;
  origemLng?: number;
  origemNome?: string;
  destinos?: { id: string; lat: number; lng: number; nome: string; endereco?: string; horario?: string }[];
  motoristaLat?: number;
  motoristaLng?: number;
  motoristas?: { id: string; lat: number; lng: number; nome: string }[];
  zoom?: number;
}

export default function MapaFallback({ origemLat, origemLng, origemNome, destinos = [], motoristaLat, motoristaLng, motoristas = [], zoom = 13 }: Props) {
  const center: [number, number] = motoristaLat ? [motoristaLat, motoristaLng || -46.6333]
    : origemLat ? [origemLat, origemLng || -46.6333]
    : [-23.5505, -46.6333];

  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Origem */}
      {origemLat && origemLng && (
        <Marker position={[origemLat, origemLng]}>
          <Popup><b>🏭 {origemNome || 'Origem'}</b><br /><span className="text-xs text-gray-500">Ponto de saída</span></Popup>
        </Marker>
      )}

      {/* Destinos */}
      {destinos.filter(d => d.lat && d.lng).map(d => (
        <Marker key={d.id} position={[d.lat, d.lng]}>
          <Popup>
            <b>📍 {d.nome}</b>
            {d.endereco && <br />}{d.endereco && <span className="text-xs">{d.endereco}</span>}
            {d.horario && <br />}{d.horario && <span className="text-xs text-blue-500">⏰ {d.horario}</span>}
          </Popup>
        </Marker>
      ))}

      {/* Motorista */}
      {motoristaLat && motoristaLng && (
        <Marker position={[motoristaLat, motoristaLng]}>
          <Popup><b>🚚 Sua posição</b></Popup>
        </Marker>
      )}

      {/* Outros motoristas */}
      {motoristas.map(m => (
        <Marker key={m.id} position={[m.lat, m.lng]}>
          <Popup><b>{m.nome}</b></Popup>
        </Marker>
      ))}

      {/* Rota */}
      {origemLat && origemLng && destinos.filter(d => d.lat).length > 0 && (
        <Polyline positions={[
          [origemLat, origemLng],
          ...destinos.filter(d => d.lat).map(d => [d.lat, d.lng] as [number, number])
        ]} color="#3b82f6" weight={3} opacity={0.4} dashArray="8,8" />
      )}
    </MapContainer>
  );
}
