'use client'

import { Check, Clock, Calendar, MessageCircle, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/data/config'
import type { PackConfig } from '@/data/config'
import Link from 'next/link'

interface PacksSectionProps {
  packs: PackConfig[]
  whatsapp?: string
}

export default function PacksSection({ packs, whatsapp }: PacksSectionProps) {
  const activePacks = packs.filter(p => !p.paused)

  if (activePacks.length === 0) return null

  const getWhatsAppLink = (pack: PackConfig) => {
    const message = `Hola! 👋 Me interesa el *${pack.name}*:\n\n📦 ${pack.classCount} clases\n💰 ${formatPrice(pack.price)}\n📅 Válido por ${pack.validityDays} días\n\n¿Me podrían dar más información?`
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
  }

  return (
    <section id="packs" className="py-24 bg-gradient-to-b from-cream-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-violet-500 text-sm font-medium tracking-widest uppercase">
            Flexibilidad Total
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-rose-800 mt-2">
            Packs de Clases
          </h2>
          <p className="text-nude-500 mt-4 max-w-2xl mx-auto">
            Comprá un pack y agendá tus clases cuando quieras. Sin compromisos mensuales, con total libertad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePacks.map((pack, index) => (
            <div
              key={pack.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover-lift border border-cream-100 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-48 overflow-hidden">
                {pack.image ? (
                  <img
                    src={pack.image}
                    alt={pack.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-100 to-rose-100 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-violet-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Válido por {pack.validityDays} días</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-violet-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {pack.classCount} clases
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-display text-xl font-medium text-rose-800 mb-2">
                  {pack.name}
                </h3>
                <p className="text-nude-500 text-sm mb-4 line-clamp-2">
                  {pack.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-sage-700">
                    <Check className="w-4 h-4" />
                    <span>Agendás cuando quieras</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sage-700">
                    <Check className="w-4 h-4" />
                    <span>{formatPrice(Math.round(pack.price / pack.classCount))} por clase</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-2xl font-semibold text-violet-600">
                    {formatPrice(pack.price)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/packs"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-full text-sm font-medium transition-colors"
                    >
                      Comprar
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {whatsapp && (
                      <a
                        href={getWhatsAppLink(pack)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                        title="Consultar por WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/packs"
            className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium"
          >
            Ver todos los packs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
