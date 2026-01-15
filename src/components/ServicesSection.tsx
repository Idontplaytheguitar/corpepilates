import ServiceCard from './ServiceCard'
import type { ServiceConfig } from '@/data/config'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'

interface ServicesSectionProps {
  services: ServiceConfig[]
  bookingEnabled?: boolean
  mercadopagoEnabled?: boolean
  location?: string
  whatsapp?: string
  email?: string
}

export default function ServicesSection({ services, bookingEnabled, mercadopagoEnabled = true, location, whatsapp, email }: ServicesSectionProps) {
  const effectiveBookingEnabled = bookingEnabled && mercadopagoEnabled
  const activeServices = services.filter(s => !s.paused)

  return (
    <section id="servicios" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sage-500 text-sm font-medium tracking-widest uppercase">
            Pilates Reformer
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-rose-800 mt-2">
            Nuestros Planes
          </h2>
          <p className="text-nude-500 mt-4 max-w-2xl mx-auto">
            {effectiveBookingEnabled
              ? 'Elegí el plan que mejor se adapte a tus objetivos y reservá tus clases online.'
              : 'Elegí el plan que mejor se adapte a tus objetivos y empezá a transformar tu cuerpo.'}
          </p>
          
          {location && (
            <p className="text-sage-600 mt-3 flex items-center justify-center gap-1">
              <MapPin className="w-4 h-4" />
              {location}
            </p>
          )}
          
          {effectiveBookingEnabled && activeServices.length > 0 && (
            <Link
              href="/reservar"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-medium transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Reservar clase
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeServices.map((service, index) => (
            <div
              key={service.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ServiceCard service={service} bookingEnabled={effectiveBookingEnabled} location={location} whatsapp={whatsapp} email={email} />
            </div>
          ))}
        </div>

        {activeServices.length === 0 && (
          <div className="text-center py-12 text-nude-400">
            No hay planes disponibles.
          </div>
        )}
      </div>
    </section>
  )
}
