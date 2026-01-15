'use client'

import { X } from 'lucide-react'
import Link from 'next/link'

export default function ReservaFallidaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-rose-500 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-10 h-10" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Pago no completado</h1>
            <p className="text-rose-100 mt-2">No pudimos procesar tu pago</p>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-nude-600 text-center">
              El pago fue rechazado o cancelado. Tu reserva no fue confirmada.
            </p>
            <p className="text-sm text-nude-500 text-center">
              Podés intentar nuevamente o contactarnos si tenés algún problema.
            </p>
          </div>

          <div className="p-6 bg-cream-50 border-t border-cream-200 space-y-3">
            <Link 
              href="/reservar"
              className="block w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-center rounded-xl font-semibold transition-colors"
            >
              Intentar nuevamente
            </Link>
            <Link 
              href="/"
              className="block w-full py-3 border border-cream-300 hover:bg-cream-100 text-nude-700 text-center rounded-xl font-medium transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
