'use client'

import { Activity, Heart, Zap } from 'lucide-react'

interface HeroProps {
  siteName?: string
  bookingEnabled?: boolean
  mercadopagoEnabled?: boolean
}

export default function Hero({ siteName = 'Corpe Pilates', bookingEnabled = true, mercadopagoEnabled = true }: HeroProps) {
  const showReservationButton = bookingEnabled && mercadopagoEnabled
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 pattern-dots opacity-30" />
      
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-rose-200 rounded-full blur-3xl opacity-40 animate-float" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-nude-200 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cream-200 rounded-full blur-3xl opacity-30" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-stagger">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-rose-200 mb-8">
            <Activity className="w-4 h-4 text-rose-500" />
            <span className="text-sm text-rose-700 font-medium">Pilates Reformer para todos</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold mb-6">
            <span className="text-gradient">{siteName}</span>
          </h1>

          <p className="text-xl sm:text-2xl text-rose-700 max-w-2xl mx-auto mb-8 leading-relaxed">
            Fortalecé tu core, cuidá tu columna y transformá tu cuerpo. 
            <span className="text-nude-500"> Clases personalizadas </span> 
            con equipos profesionales Reformer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#servicios"
              className="px-8 py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-full font-semibold hover:from-rose-600 hover:to-rose-700 transition-all hover:shadow-xl hover:shadow-rose-200 hover:-translate-y-1"
            >
              Ver Planes
            </a>
            {showReservationButton && (
              <a
                href="/reservar"
                className="px-8 py-4 bg-white/70 backdrop-blur-sm border-2 border-rose-300 text-rose-700 rounded-full font-semibold hover:bg-rose-50 hover:border-rose-400 transition-all hover:-translate-y-1"
              >
                Reservar Clase
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-rose-600">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <span>Cuidá tu columna</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-sage-500" />
              </div>
              <span>Fortalecé tu core</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-nude-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-nude-500" />
              </div>
              <span>Ganá fuerza y flexibilidad</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-rose-400 flex items-start justify-center p-2">
          <div className="w-1.5 h-2.5 bg-rose-400 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
