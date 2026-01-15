'use client'

import { useState } from 'react'
import { Check, Clock, Calendar, MessageCircle, Loader2, User, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/data/config'
import type { PackConfig } from '@/data/config'
import { useUser } from '@/context/UserContext'
import Link from 'next/link'

interface PacksSectionProps {
  packs: PackConfig[]
  whatsapp?: string
  packsEnabled?: boolean
  mercadopagoEnabled?: boolean
}

export default function PacksSection({ packs, whatsapp, packsEnabled = true, mercadopagoEnabled = true }: PacksSectionProps) {
  const { user, loading: userLoading, login } = useUser()
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const activePacks = packs.filter(p => !p.paused)

  if (!packsEnabled || activePacks.length === 0) return null

  const handlePurchase = async (packId: string) => {
    if (!user) {
      login('/#packs')
      return
    }

    setPurchasing(packId)
    setError('')

    try {
      const res = await fetch('/api/packs/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      })

      const data = await res.json()
      
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        setError(data.error || 'Error al procesar la compra')
      }
    } catch {
      setError('Error de conexion')
    }
    
    setPurchasing(null)
  }

  const getWhatsAppLink = (pack: PackConfig) => {
    const message = `Hola! Me interesa el *${pack.name}*:\n\n${pack.classCount} clases\n${formatPrice(pack.price)}\nValido por ${pack.validityDays} dias\n\nComo puedo adquirirlo?`
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
            Compra un pack y agenda tus clases cuando quieras. Sin compromisos mensuales, con total libertad.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              &times;
            </button>
          </div>
        )}

        {!userLoading && !user && mercadopagoEnabled && (
          <div className="max-w-3xl mx-auto mb-10 p-5 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 bg-violet-100 rounded-lg">
                <User className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-violet-800 mb-1">Compra online</h3>
                <p className="text-violet-700 text-sm mb-3">
                  Inicia sesion con Google para comprar packs online, agendar tus clases cuando quieras y ver tu historial.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => login('/#packs')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Iniciar sesion con Google
                  </button>
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola! Me interesan los packs de clases. Podrian darme mas informacion?')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Consultar por WhatsApp
                    </a>
                  )}
                </div>
                <p className="text-violet-600 text-xs mt-3">
                  Tambien podes <Link href="/reservar" className="underline hover:text-violet-800">reservar clases individuales</Link> sin necesidad de cuenta.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePacks.map((pack, index) => (
            <div
              key={pack.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover-lift border border-cream-100 animate-fade-in flex flex-col"
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
                    <span>Valido por {pack.validityDays} dias</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-violet-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {pack.classCount} clases
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-display text-xl font-medium text-rose-800 mb-2">
                  {pack.name}
                </h3>
                <p className="text-nude-500 text-sm mb-4 line-clamp-2 flex-1">
                  {pack.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-sage-700">
                    <Check className="w-4 h-4" />
                    <span>Agendas cuando quieras</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sage-700">
                    <Check className="w-4 h-4" />
                    <span>{formatPrice(Math.round(pack.price / pack.classCount))} por clase</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-cream-100">
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-2xl font-semibold text-violet-600">
                      {formatPrice(pack.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {mercadopagoEnabled && (
                      <button
                        onClick={() => handlePurchase(pack.id)}
                        disabled={purchasing === pack.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        {purchasing === pack.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Procesando...
                          </>
                        ) : user ? (
                          'Comprar'
                        ) : (
                          'Ingresar y comprar'
                        )}
                      </button>
                    )}
                    {whatsapp && (
                      <a
                        href={getWhatsAppLink(pack)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${mercadopagoEnabled ? 'p-3' : 'flex-1 flex items-center justify-center gap-2 px-4 py-3'} bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors`}
                        title="Consultar por WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                        {!mercadopagoEnabled && <span>Consultar por WhatsApp</span>}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
