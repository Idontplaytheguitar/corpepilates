'use client'

import { useState } from 'react'
import { Check, Clock, Calendar, MessageCircle, X, Loader2 } from 'lucide-react'
import AliasQRBox from './AliasQRBox'
import { formatPrice } from '@/data/config'
import type { PackConfig, SiteConfig } from '@/data/config'
import { useUser } from '@/context/UserContext'

interface PacksSectionProps {
  packs: PackConfig[]
  whatsapp?: string
  packsEnabled?: boolean
  mercadopagoEnabled?: boolean
  aliasConfig?: SiteConfig['aliasConfig']
}

export default function PacksSection({ packs, whatsapp, packsEnabled = true, aliasConfig }: PacksSectionProps) {
  const activePacks = packs.filter(p => !p.paused)
  const { user, login } = useUser()

  const [buyingPack, setBuyingPack] = useState<PackConfig | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'alias' | 'efectivo' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [buySuccess, setBuySuccess] = useState(false)
  const [buyError, setBuyError] = useState('')

  if (!packsEnabled || activePacks.length === 0) return null

  const getWhatsAppLink = (pack: PackConfig) => {
    const message = `Hola! Me interesa el *${pack.name}*:\n\n${pack.classCount} clases\n${formatPrice(pack.price)}\nValido por ${pack.validityDays} dias\n\nComo puedo adquirirlo?`
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
  }

  const handleOpenModal = (pack: PackConfig) => {
    setBuyingPack(pack)
    setPaymentMethod(null)
    setBuySuccess(false)
    setBuyError('')
  }

  const handleCloseModal = () => {
    if (submitting) return
    setBuyingPack(null)
    setPaymentMethod(null)
    setBuySuccess(false)
    setBuyError('')
  }

  const handleConfirm = async () => {
    if (!buyingPack || !paymentMethod) return
    setSubmitting(true)
    setBuyError('')
    try {
      const res = await fetch('/api/packs/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: buyingPack.id, paymentMethod }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBuySuccess(true)
        setTimeout(() => {
          handleCloseModal()
        }, 3000)
      } else {
        setBuyError(data.error || 'Error al procesar la compra')
      }
    } catch {
      setBuyError('Error de red. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section id="packs" className="py-24 bg-gradient-to-b from-cream-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-eyebrow text-rose-500 justify-center mb-3">
              Flexibilidad Total
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-rose-800 mt-2">
              Packs de Clases
            </h2>
            <div className="flex items-center justify-center gap-3 mt-4 mb-4">
              <div className="h-px w-12 bg-nude-300" />
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <div className="h-px w-12 bg-nude-300" />
            </div>
            <p className="text-nude-500 mt-4 max-w-2xl mx-auto">
              Compra un pack y agenda tus clases cuando quieras. Sin compromisos mensuales, con total libertad.
            </p>
          </div>

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
                      <button
                        onClick={() => handleOpenModal(pack)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors font-medium"
                      >
                        Comprar
                      </button>
                      {whatsapp && (
                        <a
                          href={getWhatsAppLink(pack)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
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
        </div>
      </section>

      {/* Purchase Modal */}
      {buyingPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-6 border-b border-cream-100">
              <div>
                <h3 className="font-display text-xl font-semibold text-rose-800">{buyingPack.name}</h3>
                <p className="text-violet-600 font-semibold mt-1">{formatPrice(buyingPack.price)}</p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-2 rounded-xl hover:bg-cream-100 text-nude-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {buySuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-rose-800 text-lg mb-2">¡Solicitud enviada!</h4>
                  <p className="text-nude-500 text-sm">
                    Tu solicitud de compra fue recibida. Te avisaremos cuando el pago sea verificado.
                  </p>
                </div>
              ) : !user ? (
                <div className="text-center py-6">
                  <p className="text-nude-600 mb-4">Necesitás iniciar sesión para comprar</p>
                  <button
                    onClick={() => login()}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors font-medium"
                  >
                    Iniciar sesión con Google
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-nude-600 text-sm mb-4 font-medium">Elegí cómo querés pagar:</p>
                  <div className="space-y-3 mb-6">
                    <button
                      onClick={() => setPaymentMethod('alias')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                        paymentMethod === 'alias'
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-cream-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="font-medium text-rose-800">Transferencia bancaria</div>
                      <div className="text-sm text-nude-500 mt-1">Alias o CBU — pagás antes de la primera clase</div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                        paymentMethod === 'efectivo'
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-cream-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="font-medium text-rose-800">Efectivo en primera clase</div>
                      <div className="text-sm text-nude-500 mt-1">Pagás en mano el día que empezás</div>
                    </button>
                  </div>

                  {paymentMethod === 'alias' && aliasConfig && (aliasConfig.alias || aliasConfig.cbu) && (
                    <div className="mb-6">
                      <AliasQRBox aliasConfig={aliasConfig} accentColor="violet" />
                    </div>
                  )}

                  {buyError && (
                    <p className="text-red-500 text-sm mb-4">{buyError}</p>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={!paymentMethod || submitting}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Confirmar compra'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
