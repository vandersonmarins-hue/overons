'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });

import 'leaflet/dist/leaflet.css';

interface Props {
  motoristaLat?: number;
  motoristaLng?: number;
  destinoLat: number;
  destinoLng: number;
  motoristaNome: string;
}

export default function MapaRastreamento({ motoristaLat, motoristaLng, destinoLat, destinoLng, motoristaNome }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const centerLat = motoristaLat || destinoLat;
  const centerLng = motoristaLng || destinoLng;

  if (!mounted) {
    return <div className="h-full w-full bg-gray-800 animate-pulse rounded-2xl flex items-center justify-center"><span className="text-gray-500">Carregando mapa...</span></div>;
  }

  return (
    <MapContainer center={[centerLat, centerLng]} zoom={14} className="h-full w-full rounded-2xl" zoomControl={false} attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[destinoLat, destinoLng]}>
        <Popup><div className="font-bold text-sm">📍 Seu endereço</div><div className="text-xs text-gray-500">Destino da entrega</div></Popup>
      </Marker>
      {motoristaLat && motoristaLng && (
        <>
          <Marker position={[motoristaLat, motoristaLng]}>
            <Popup><div className="font-bold text-sm">🚚 {motoristaNome}</div><div className="text-xs text-gray-500">Motorista a caminho</div></Popup>
          </Marker>
          <Polyline positions={[[motoristaLat, motoristaLng], [destinoLat, destinoLng]]} color="#3b82f6" weight={3} opacity={0.6} dashArray="10, 10" />
        </>
      )}
    </MapContainer>
  );
}
