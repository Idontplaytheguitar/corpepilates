'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Calendar, MessageCircle, Mail, X, ShoppingBag, Check } from 'lucide-react'
import { formatPrice } from '@/data/config'
import type { ServiceConfig } from '@/data/config'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'

interface ServiceCardProps {
  service: ServiceConfig
  bookingEnabled?: boolean
  location?: string
  whatsapp?: string
  email?: string
}

function ContactModal({ 
  service, 
  whatsapp, 
  email, 
  location, 
  onClose 
}: { 
  service: ServiceConfig
  whatsapp?: string
  email?: string
  location?: string
  onClose: () => void
}) {
  const getWhatsAppLink = () => {
    const message = `Hola! 👋 Me gustaría consultar disponibilidad para el servicio:\n\n*${service.name}*\n💰 ${formatPrice(service.price)}\n⏱️ ${service.duration}${location ? `\n📍 ${location}` : ''}\n\n¿Tienen turnos disponibles?`
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
  }

  const getEmailLink = () => {
    const subject = `Consulta de disponibilidad: ${service.name}`
    const body = `Hola!\n\nMe gustaría consultar disponibilidad para el servicio:\n\n${service.name}\nPrecio: ${formatPrice(service.price)}\nDuración: ${service.duration}${location ? `\nUbicación: ${location}` : ''}\n\n¿Tienen turnos disponibles?\n\nGracias!`
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Consultar disponibilidad</h3>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">{service.name}</p>
        </div>
        
        <div className="p-4 space-y-3">
          <p className="text-nude-600 text-sm text-center mb-4">
            ¿Cómo preferís contactarnos?
          </p>
          
          {whatsapp && (
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-medium text-green-800 block">WhatsApp</span>
                <span className="text-sm text-green-600">Respuesta rápida</span>
              </div>
            </a>
          )}
          
          {email && (
            <a
              href={getEmailLink()}
              onClick={onClose}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 transition-all group"
            >
              <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-medium text-rose-800 block">Email</span>
                <span className="text-sm text-rose-600">Consulta formal</span>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function ServiceCard({ service, bookingEnabled, location, whatsapp, email }: ServiceCardProps) {
  const [showContactModal, setShowContactModal] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addService } = useCart()

  const handleAddToCart = () => {
    addService({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      durationMinutes: service.durationMinutes,
      image: service.image,
      bookable: service.bookable
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const hasContactMethods = whatsapp || email

  return (
    <>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover-lift border border-cream-200 card-accent">
        <div className="relative h-48 overflow-hidden">
          {service.image ? (
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center">
              <span className="text-4xl">💆</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Clock className="w-4 h-4" />
              <span>{service.duration}</span>
            </div>
          </div>
          {bookingEnabled && (
            <div className="absolute top-3 right-3 bg-sage-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Reserva online
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-display text-xl font-medium text-rose-800 mb-2">
            {service.name}
          </h3>
          <p className="text-nude-500 text-sm mb-4 line-clamp-2">
            {service.description}
          </p>
          <div className="flex flex-col gap-3">
            <span className="text-2xl font-display font-semibold text-rose-700">
              {formatPrice(service.price)}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {bookingEnabled && (
                <>
                  <button
                    onClick={handleAddToCart}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      addedToCart 
                        ? 'bg-green-500 text-white' 
                        : 'bg-sage-100 hover:bg-sage-200 text-sage-700'
                    }`}
                  >
                    {addedToCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                  </button>
                  <Link
                    href={`/reservar?servicio=${service.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Reservar
                  </Link>
                </>
              )}
              {hasContactMethods && (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar
                </button>
              )}
              {!bookingEnabled && !hasContactMethods && (
                <span className="text-sm text-nude-400">
                  Sin reserva online
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showContactModal && (
        <ContactModal
          service={service}
          whatsapp={whatsapp}
          email={email}
          location={location}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </>
  )
}
