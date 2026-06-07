const OVERONS_URL = process.env.OVERONS_API_URL || 'http://localhost:3000';

export async function overonsApi(path: string, options?: RequestInit) {
  const res = await fetch(`${OVERONS_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Overons API ${res.status}: ${path}`);
  return res.json();
}

// Driver list
export async function getDrivers() {
  return overonsApi('/api/entregadores');
}

// Real-time active drivers
export async function getActiveDrivers() {
  return overonsApi('/api/drivers');
}

// Deliveries
export async function getDeliveries(dias = 30) {
  return overonsApi(`/api/deliveries/history?dias=${dias}`);
}

// KPIs
export async function getKpis() {
  return overonsApi('/api/kpis');
}

// Ranking
export async function getRanking() {
  return overonsApi('/api/ranking');
}

// Alerts
export async function getAlerts() {
  return overonsApi('/api/alerts');
}

// Messages
export async function getMessages() {
  return overonsApi('/api/messages');
}

export async function sendMessage(driverId: string, message: string, empresa = 'Marins ERP') {
  return overonsApi('/api/send-message', {
    method: 'POST',
    body: JSON.stringify({ driverId, message, empresa }),
  });
}

// Charts
export async function getKmPorDia() {
  return overonsApi('/api/charts/km-por-dia');
}

export async function getEtaVsRealidade() {
  return overonsApi('/api/charts/eta-vs-realidade');
}

export async function getTopAtrasos() {
  return overonsApi('/api/charts/top-atrasos');
}

// Top 3 gamification
export async function getTop3() {
  return overonsApi('/api/top3');
}

// Scorecards
export async function getScorecards() {
  return overonsApi('/api/scorecards');
}

// Reports
export async function getReport(path: string, params = '') {
  return overonsApi(`/api/reports/${path}${params}`);
}
