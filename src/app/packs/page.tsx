'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Loader2, Calendar, Clock, AlertCircle, MessageCircle, User } from 'lucide-react'
import { formatPrice } from '@/data/config'
import type { PackConfig, SiteConfig } from '@/data/config'
import Link from 'next/link'
import { useUser } from '@/context/UserContext'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PacksContent() {
  const searchParams = useSearchParams()
  const packError = searchParams.get('pack_error')
  
  const { user, loading: userLoading, login } = useUser()
  const [packs, setPacks] = useState<PackConfig[]>([])
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/packs').then(res => res.json()),
      fetch('/api/admin/config').then(res => res.json())
    ]).then(([packsData, configData]) => {
      setPacks(packsData.packs || [])
      setSiteConfig(configData.site || null)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const handlePurchase = async (packId: string) => {
    if (!user) {
      login('/packs')
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
      setError('Error de conexi?n')
    }
    
    setPurchasing(null)
  }

  const getWhatsAppLink = (pack?: PackConfig) => {
    if (pack) {
      const message = `Hola! ?? Me interesa comprar el *${pack.name}*:\n\n?? ${pack.classCount} clases\n?? ${formatPrice(pack.price)}\n?? V?lido por ${pack.validityDays} d?as\n\n?C?mo puedo adquirirlo?`
      return `https://wa.me/${siteConfig?.whatsapp}?text=${encodeURIComponent(message)}`
    }
    const message = `Hola! ?? Me interesa comprar un pack de clases. ?Podr?an darme m?s informaci?n?`
    return `https://wa.me/${siteConfig?.whatsapp}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    )
  }

  if (!siteConfig?.mercadopagoEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Calendar className="w-16 h-16 text-nude-300 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-rose-800 mb-2">
              Packs no disponibles
            </h1>
            <p className="text-nude-500 mb-6">
              La compra de packs online no est? habilitada en este momento. Contactanos para m?s informaci?n.
            </p>
            {siteConfig?.whatsapp && (
              <a 
                href={`https://wa.me/${siteConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-rose-800">
            Packs de Clases
          </h1>
          <p className="text-nude-500 mt-2">
            Compr? un pack y agend? tus clases cuando quieras
          </p>
        </div>

        {packError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Hubo un error con el pago. Por favor intent? nuevamente.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!userLoading && !user && (
          <div className="mb-6 p-5 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-violet-100 rounded-lg">
                <User className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-violet-800 mb-1">?Por qu? iniciar sesi?n?</h3>
                <p className="text-violet-700 text-sm mb-3">
                  Al iniciar sesi?n con Google pod?s comprar packs online, agendar tus clases cuando quieras y ver tu historial de reservas.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => login('/packs')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Iniciar sesi?n con Google
                  </button>
                  {siteConfig?.whatsapp && (
                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contratar por WhatsApp
                    </a>
                  )}
                </div>
                <p className="text-violet-600 text-xs mt-3">
                  Tambi?n pod?s <Link href="/reservar" className="underline hover:text-violet-800">agendar clases individuales</Link> sin necesidad de cuenta.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map(pack => (
            <div 
              key={pack.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col"
            >
              {pack.image ? (
                <img src={pack.image} alt={pack.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-violet-100 to-rose-100 flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-violet-300" />
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-display text-xl font-semibold text-rose-800 mb-2">
                  {pack.name}
                </h3>
                
                <p className="text-nude-500 text-sm mb-4 flex-1">
                  {pack.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-sage-700">
                    <Check className="w-4 h-4" />
                    <span>{pack.classCount} clases incluidas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sage-700">
                    <Clock className="w-4 h-4" />
                    <span>V?lido por {pack.validityDays} d?as</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sage-700">
                    <Calendar className="w-4 h-4" />
                    <span>Agend?s cuando quieras</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-cream-200">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-violet-600">
                        {formatPrice(pack.price)}
                      </p>
                      {pack.classCount > 0 && (
                        <p className="text-xs text-nude-500">
                          {formatPrice(Math.round(pack.price / pack.classCount))} por clase
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePurchase(pack.id)}
                      disabled={purchasing === pack.id}
                      className="flex-1 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                    {!user && siteConfig?.whatsapp && (
                      <a
                        href={getWhatsAppLink(pack)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
                        title="Contratar por WhatsApp"
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

        {packs.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-nude-300 mx-auto mb-4" />
            <h2 className="font-display text-xl text-nude-500 mb-2">
              No hay packs disponibles
            </h2>
            <p className="text-nude-400">
              Contactanos para m?s informaci?n sobre nuestros packs.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PacksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    }>
      <PacksContent />
    </Suspense>
  )
}
