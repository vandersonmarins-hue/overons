'use client';

import { useEffect, useState } from 'react';
import { FileText, Fuel, CheckCircle, TrendingUp, Download, Filter } from 'lucide-react';

export default function CompanyReportsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [driver, setDriver] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/motorista/reports?period=${period}&driver=${driver}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period, driver]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-9 h-9 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg">Relatórios da Frota</h1>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
              <option value="all">Todo período</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando relatórios...</div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-green-500 mb-1"><CheckCircle size={18} /> Check-ins</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data?.summary?.completedChecklists || 0}<span className="text-sm text-gray-400 font-normal">/{data?.summary?.totalChecklists || 0}</span></div>
                <div className="text-xs text-gray-500">{data?.summary?.completionRate || 0}% de conclusão</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-orange-500 mb-1"><Fuel size={18} /> Despesas</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">R$ {data?.summary?.totalExpenses?.toFixed(2) || '0,00'}</div>
                <div className="text-xs text-gray-500">Total do período</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-blue-500 mb-1"><FileText size={18} /> Entregas</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data?.summary?.totalDeliveries || 0}</div>
                <div className="text-xs text-gray-500">No período</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-purple-500 mb-1"><TrendingUp size={18} /> Performance</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data?.checklists?.length || 0}</div>
                <div className="text-xs text-gray-500">Checklists enviados</div>
              </div>
            </div>

            {/* Despesas por tipo */}
            {data?.summary?.byExpenseType && Object.keys(data.summary.byExpenseType).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">💰 Despesas por Tipo</h3>
                <div className="space-y-2">
                  {Object.entries(data.summary.byExpenseType).map(([type, value]: [string, any]) => (
                    <div key={type} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type === 'toll' ? 'Pedágio' : type === 'parking' ? 'Estacionamento' : type === 'meal' ? 'Alimentação' : type === 'fuel' ? 'Combustível' : type === 'maintenance' ? 'Manutenção' : type}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">R$ {value.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex items-center justify-between font-bold">
                    <span className="text-sm">Total</span>
                    <span className="text-orange-500">R$ {data.summary.totalExpenses.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Últimos Checklists */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white">📋 Últimos Checklists</h3>
                <button onClick={() => {
                  const csv = 'data:text/csv;charset=utf-8,' + ['Data,Motorista,Itens,Observações'].concat(
                    (data?.checklists || []).map((c: any) => `"${c.date}","${c.driverName}","${(c.items||[]).join('; ')}","${c.notes||''}"`)
                  ).join('\n');
                  const a = document.createElement('a'); a.href = encodeURI(csv); a.download = 'checklists.csv'; a.click();
                }} className="text-blue-600 text-sm flex items-center gap-1 hover:underline"><Download size={14} /> Exportar CSV</button>
              </div>
              {data?.checklists?.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Nenhum checklist enviado neste período</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 text-gray-500 font-medium">Data</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Motorista</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Itens</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Obs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.checklists || []).map((c: any) => (
                        <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-2 text-gray-900 dark:text-white">{c.date}</td>
                          <td className="py-2 text-gray-700 dark:text-gray-300">{c.driverName}</td>
                          <td className="py-2"><span className="text-green-600 text-xs">{c.items?.length || 0} itens</span></td>
                          <td className="py-2 text-gray-400 text-xs">{c.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Últimas Despesas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white">💳 Últimas Despesas</h3>
                <button onClick={() => {
                  const csv = 'data:text/csv;charset=utf-8,' + ['Data,Motorista,Tipo,Valor,Descrição'].concat(
                    (data?.expenses || []).map((e: any) => `"${e.date}","${e.driverName}","${e.type}","${e.value}","${e.description||''}"`)
                  ).join('\n');
                  const a = document.createElement('a'); a.href = encodeURI(csv); a.download = 'despesas.csv'; a.click();
                }} className="text-blue-600 text-sm flex items-center gap-1 hover:underline"><Download size={14} /> Exportar CSV</button>
              </div>
              {data?.expenses?.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Nenhuma despesa registrada neste período</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 text-gray-500 font-medium">Data</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Motorista</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Tipo</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Valor</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.expenses || []).map((e: any) => (
                        <tr key={e.id} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-2 text-gray-900 dark:text-white">{e.date}</td>
                          <td className="py-2 text-gray-700 dark:text-gray-300">{e.driverName}</td>
                          <td className="py-2 capitalize">{e.type === 'toll' ? 'Pedágio' : e.type === 'parking' ? 'Estacionamento' : e.type === 'meal' ? 'Alimentação' : e.type === 'fuel' ? 'Combustível' : e.type === 'maintenance' ? 'Manutenção' : e.type}</td>
                          <td className="py-2 font-semibold text-orange-600">R$ {e.value?.toFixed(2)}</td>
                          <td className="py-2 text-gray-400 text-xs">{e.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
