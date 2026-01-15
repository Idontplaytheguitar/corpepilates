import { Clock, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getStoredConfig } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export default async function PendingPage() {
  const config = await getStoredConfig()

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 pt-24 pb-12">
      <div className="max-w-md w-full text-center">
        <div className="animate-fade-in">
          <div className="w-24 h-24 bg-nude-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Clock className="w-12 h-12 text-nude-500" />
          </div>

          <h1 className="font-display text-4xl font-semibold text-rose-800 mb-4">
            Pago pendiente
          </h1>

          <p className="text-nude-600 mb-8 leading-relaxed">
            Tu pago está siendo procesado. Una vez que se acredite, 
            recibirás un email de confirmación con los detalles de tu pedido.
          </p>

          <div className="p-6 bg-cream-50 rounded-2xl mb-8">
            <p className="text-sm text-nude-600 mb-4">
              Si tenés alguna consulta, no dudes en contactarnos:
            </p>
            <a
              href={`https://wa.me/${config.site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sage-600 font-medium hover:text-sage-700"
            >
              <MessageCircle className="w-5 h-5" />
              Escribinos por WhatsApp
            </a>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
