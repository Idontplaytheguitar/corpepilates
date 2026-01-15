'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Loader2, Calendar, Clock, AlertCircle } from 'lucide-react'
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
      setError('Error de conexión')
    }
    
    setPurchasing(null)
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
              La compra de packs online no está habilitada en este momento. Contactanos para más información.
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
            Comprá un pack y agendá tus clases cuando quieras
          </p>
        </div>

        {packError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Hubo un error con el pago. Por favor intentá nuevamente.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!userLoading && !user && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-700">
              Para comprar un pack necesitás iniciar sesión con tu cuenta de Google. 
              Esto te permite agendar tus clases y ver tu historial.
            </p>
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
                    <span>Válido por {pack.validityDays} días</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sage-700">
                    <Calendar className="w-4 h-4" />
                    <span>Agendás cuando quieras</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-cream-200">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-rose-600">
                        {formatPrice(pack.price)}
                      </p>
                      {pack.classCount > 0 && (
                        <p className="text-xs text-nude-500">
                          {formatPrice(Math.round(pack.price / pack.classCount))} por clase
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={purchasing === pack.id}
                    className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {purchasing === pack.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : user ? (
                      'Comprar Pack'
                    ) : (
                      'Iniciar sesión y comprar'
                    )}
                  </button>
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
              Contactanos para más información sobre nuestros packs.
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
