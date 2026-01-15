'use client'

import { Clock } from 'lucide-react'
import Link from 'next/link'

export default function ReservaPendientePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-amber-500 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Pago Pendiente</h1>
            <p className="text-amber-100 mt-2">Tu pago está siendo procesado</p>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-nude-600 text-center">
              El pago está pendiente de acreditación. Una vez confirmado, recibirás 
              un email con los detalles de tu reserva.
            </p>
            <p className="text-sm text-nude-500 text-center">
              Esto puede tomar algunos minutos. Si pagaste en efectivo (ej: Rapipago), 
              puede demorar hasta 2 días hábiles.
            </p>
          </div>

          <div className="p-6 bg-cream-50 border-t border-cream-200">
            <Link 
              href="/"
              className="block w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-center rounded-xl font-semibold transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
