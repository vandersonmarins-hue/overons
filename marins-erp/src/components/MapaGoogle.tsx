'use client';

import { useState, useEffect } from 'react';
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api';
import MapaFallback from './MapaFallback';

const API_KEY = 'AIzaSyAt3eYbH9YklC9DcdU_5mpJUqj9mvqzvM8';
const containerStyle = { width: '100%', height: '100%', borderRadius: '12px' };

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

export default function MapaGoogle(props: Props) {
  const { origemLat, origemLng, origemNome, destinos = [], motoristaLat, motoristaLng, motoristas = [], zoom = 13 } = props;
  const [usarFallback, setUsarFallback] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: ['places'],
  });

  // Se Google falhar (billing desativado, etc), usa fallback
  useEffect(() => {
    if (loadError) setUsarFallback(true);
  }, [loadError]);

  // Se timeout de 8s sem carregar, usa fallback
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => {
      if (!isLoaded) setUsarFallback(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  if (usarFallback) return <MapaFallback {...props} />;

  if (!isLoaded) return <div className="h-full w-full bg-gray-800 animate-pulse rounded-2xl flex items-center justify-center text-gray-500 text-sm">Carregando mapa...</div>;

  const center = motoristaLat ? { lat: motoristaLat, lng: motoristaLng || -46.6333 }
    : origemLat ? { lat: origemLat, lng: origemLng || -46.6333 }
    : { lat: -23.5505, lng: -46.6333 };

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={zoom} options={{
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
    }}>
      {origemLat && origemLng && (
        <MarkerF position={{ lat: origemLat, lng: origemLng }}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: { width: 36, height: 36 } as any }}
          title={origemNome || 'Origem'} />
      )}
      {destinos.map(d => d.lat && d.lng && (
        <MarkerF key={d.id} position={{ lat: d.lat, lng: d.lng }}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: { width: 36, height: 36 } as any }}
          title={d.nome} />
      ))}
      {motoristaLat && motoristaLng && (
        <MarkerF position={{ lat: motoristaLat, lng: motoristaLng }}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', scaledSize: { width: 40, height: 40 } as any }}
          title="Sua posição" />
      )}
      {motoristas.map(m => (
        <MarkerF key={m.id} position={{ lat: m.lat, lng: m.lng }}
          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', scaledSize: { width: 36, height: 36 } as any }}
          title={m.nome} />
      ))}
      {origemLat && origemLng && destinos.filter(d => d.lat).length > 0 && (
        <PolylineF path={[
          { lat: origemLat, lng: origemLng },
          ...destinos.filter(d => d.lat).map(d => ({ lat: d.lat, lng: d.lng })),
        ]} options={{ strokeColor: '#3b82f6', strokeWeight: 3, strokeOpacity: 0.5 }} />
      )}
    </GoogleMap>
  );
}
