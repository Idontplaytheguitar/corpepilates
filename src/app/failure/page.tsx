'use client'

import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function FailurePage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 pt-24 pb-12">
      <div className="max-w-md w-full text-center">
        <div className="animate-fade-in">
          <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-12 h-12 text-rose-500" />
          </div>

          <h1 className="font-display text-4xl font-semibold text-rose-800 mb-4">
            Pago no completado
          </h1>

          <p className="text-nude-600 mb-8 leading-relaxed">
            Hubo un problema al procesar tu pago. No te preocupes, 
            tus productos siguen en el carrito. Podés intentar nuevamente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-rose-300 text-rose-700 rounded-full font-medium hover:bg-rose-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
