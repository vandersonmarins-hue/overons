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
        <p className="text-gray-500 dark:text-gray-400 mb-8">Sistema de gestão logística</p>
        <Link href="/dashboard/empresa/relatorios"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
          Relat�rios da Frota
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
        </Link>
      </div>
    </div>
  );
}


<div class="mt-4"><a href="/dashboard/motorista" class="text-blue-600 hover:underline text-sm">? Painel do Motorista</a></div>
