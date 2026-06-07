import Link from 'next/link';
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md">
        <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="text-white" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 17h14M5 17a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2M5 17l3-3m11 3l-3-3m-5 3V7m0 0L8 10m4-3l4 3" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Marins ERP</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Sistema de gestao logistica</p>
        <div className="flex flex-col gap-3">
          <a href="/dashboard/motorista" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg">Painel do Motorista</a>
          <a href="/dashboard/integrado" className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg">Painel Integrado (Overons)</a>
          <a href="/cadastro-motorista" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-colors shadow-lg mb-3">🚚 Quero ser Transportador</a>
          <a href="/central" className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg">Central de Monitoramento</a>
          <a href="/dashboard/empresa/relatorios" className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg">Relatorios da Frota</a>
          <a href="/rastreamento/PED-2024-001" className="inline-flex items-center justify-center gap-2 text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-8 py-3 rounded-xl font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">Rastrear Pedido</a>
        </div>
      </div>
    </div>
  );
}
