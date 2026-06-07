import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../hooks/useApi';
import './ChartsSection.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const colors = { green: '#00b894', red: '#d63031', yellow: '#fdcb6e', blue: '#0984e3', purple: '#6c5ce7' };

function ChartCard({ title, children }) {
  return (
    <div className="chart-card">
      <h4 className="chart-title">{title}</h4>
      {children}
    </div>
  );
}

export default function ChartsSection() {
  const [kmData, setKmData] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [topAtrasos, setTopAtrasos] = useState(null);

  useEffect(() => {
    api('/api/charts/km-por-dia').then(setKmData).catch(console.error);
    api('/api/charts/eta-vs-realidade').then(setEtaData).catch(console.error);
    api('/api/charts/top-atrasos').then(setTopAtrasos).catch(console.error);
  }, []);

  return (
    <div className="charts-grid">
      <ChartCard title="📈 KM Rodado por Dia (últimos 30 dias)">
        {kmData && <Line data={{
          labels: kmData.map(d => d.data?.substring(5) || ''),
          datasets: [{ label: 'KM', data: kmData.map(d => d.km || 0), borderColor: colors.green, backgroundColor: colors.green + '22', fill: true, tension: 0.3 }]
        }} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
      </ChartCard>

      <ChartCard title="⏱️ ETA vs Realidade (média do dia)">
        {etaData && <Bar data={{
          labels: etaData.map(d => d.dia || ''),
          datasets: [
            { label: 'Previsto (min)', data: etaData.map(d => d.previsto || 0), backgroundColor: colors.blue },
            { label: 'Real (min)', data: etaData.map(d => d.real || 0), backgroundColor: colors.yellow },
          ]
        }} options={{ responsive: true, plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } } }} />}
      </ChartCard>

      <ChartCard title="🐌 Top 5 Piores por Atraso">
        {topAtrasos && <Bar data={{
          labels: topAtrasos.map(d => d.nome || d.id),
          datasets: [{ label: 'Atraso médio (min)', data: topAtrasos.map(d => d.atrasoMedio || 0), backgroundColor: topAtrasos.map((_, i) => i === 0 ? colors.red : i < 3 ? colors.yellow : colors.green) }]
        }} options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }} />}
      </ChartCard>
    </div>
  );
}
