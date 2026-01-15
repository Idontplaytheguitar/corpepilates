'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Calendar, Clock, User, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import type { Reservation } from '@/data/config'

function ConfirmadaContent() {
  const searchParams = useSearchParams()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = searchParams.get('id')
    const paymentId = searchParams.get('payment_id')
    
    if (id) {
      fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id, paymentId })
      })
        .then(res => res.json())
        .then(data => {
          setReservation(data.reservation)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-nude-500">Confirmando tu reserva...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-sage-500 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10" />
            </div>
            <h1 className="font-display text-2xl font-semibold">¡Reserva Confirmada!</h1>
            <p className="text-sage-100 mt-2">Tu turno ha sido reservado exitosamente</p>
          </div>

          {reservation && (
            <div className="p-6 space-y-6">
              <div className="bg-sage-50 rounded-xl p-4">
                <h2 className="font-medium text-sage-800 mb-3">{reservation.serviceName}</h2>
                <div className="space-y-2 text-sm text-sage-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="capitalize">{formatDate(reservation.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{reservation.time}hs</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-nude-600">
                  <User className="w-4 h-4" />
                  <span>{reservation.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-nude-600">
                  <Mail className="w-4 h-4" />
                  <span>{reservation.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-nude-600">
                  <Phone className="w-4 h-4" />
                  <span>{reservation.customerPhone}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-cream-200">
                <p className="text-sm text-nude-500 text-center">
                  Te enviaremos un recordatorio antes de tu turno. 
                  Si necesitás cancelar o reprogramar, contactanos por WhatsApp.
                </p>
              </div>
            </div>
          )}

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

export default function ReservaConfirmadaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-nude-500">Cargando...</p>
        </div>
      </div>
    }>
      <ConfirmadaContent />
    </Suspense>
  )
}
