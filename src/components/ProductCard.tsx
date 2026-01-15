'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ShoppingBag, Plus, MessageCircle, Mail, X, Package } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/data/config'
import type { ProductConfig } from '@/data/config'

interface ProductCardProps {
  product: ProductConfig
  whatsapp?: string
  email?: string
}

function ContactModal({ 
  product, 
  whatsapp, 
  email, 
  onClose 
}: { 
  product: ProductConfig
  whatsapp?: string
  email?: string
  onClose: () => void
}) {
  const getWhatsAppLink = () => {
    const message = `Hola! 👋 Me interesa consultar sobre:\n\n*${product.name}*\n💰 ${formatPrice(product.price)}\n\n¿Tienen disponibilidad?`
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
  }

  const getEmailLink = () => {
    const subject = `Consulta: ${product.name}`
    const body = `Hola!\n\nMe interesa consultar sobre:\n\n${product.name}\nPrecio: ${formatPrice(product.price)}\n\n¿Tienen disponibilidad?\n\nGracias!`
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (typeof window === 'undefined') return null

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
            <h3 className="text-white font-semibold">Consultar producto</h3>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">{product.name}</p>
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

export default function ProductCard({ product, whatsapp, email }: ProductCardProps) {
  const [showContactModal, setShowContactModal] = useState(false)
  const { addItem } = useCart()
  const hasContactMethods = whatsapp || email

  const cartProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    image: product.image,
    featured: product.featured,
    trackStock: product.trackStock,
    stock: product.stock,
  }

  const isOutOfStock = product.trackStock && product.stock !== undefined && product.stock <= 0

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover-lift border border-cream-100">
      <div className="relative aspect-square overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-cream-100 flex items-center justify-center">
            <span className="text-4xl">🧴</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {product.featured && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-rose-500 text-white text-xs font-medium rounded-full">
            Destacado
          </div>
        )}

        {!isOutOfStock && (
          <button
            onClick={() => addItem(cartProduct)}
            className="absolute bottom-3 right-3 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:scale-110"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <Plus className="w-5 h-5 text-rose-600" />
          </button>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-medium text-rose-800 mb-1">
          {product.name}
        </h3>
        <p className="text-nude-500 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-semibold text-rose-600">
              {formatPrice(product.price)}
            </span>
            {product.trackStock && product.stock !== undefined && (
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                product.stock <= 0 
                  ? 'bg-red-100 text-red-600' 
                  : product.stock <= 3 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-sage-100 text-sage-700'
              }`}>
                <Package className="w-3 h-3" />
                {product.stock <= 0 ? 'Sin stock' : `${product.stock} disponibles`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isOutOfStock ? (
              <span className="text-sm text-red-500 font-medium">Producto agotado</span>
            ) : (
              <button
                onClick={() => addItem(cartProduct)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full text-sm font-medium transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Agregar
              </button>
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
          </div>
        </div>
      </div>

      {showContactModal && (
        <ContactModal
          product={product}
          whatsapp={whatsapp}
          email={email}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </div>
  )
}
