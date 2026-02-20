import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 select-none">404</div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
          Página não encontrada
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
          A página que procura não existe ou foi movida. Verifique o endereço ou volte à página
          inicial.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Voltar ao início
          </Link>
        </div>
        <p className="mt-12 text-xs text-gray-400 dark:text-gray-600">
          Moneto — Family Financial Management
        </p>
      </div>
    </div>
  )
}
