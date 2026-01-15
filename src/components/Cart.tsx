'use client'

import { X, Plus, Minus, ShoppingBag, CreditCard, AlertCircle, Package, Clock, Calendar } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/data/config'
import type { SiteConfig } from '@/data/config'

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)\.]/g, '')
  return /^\+?\d{8,15}$/.test(clean)
}

export default function Cart() {
  const router = useRouter()
  const { 
    items, 
    serviceItems,
    isOpen, 
    setIsOpen, 
    removeItem, 
    removeService,
    updateQuantity, 
    updateServiceQuantity,
    total, 
    clearCart, 
    hasServices,
    stockError, 
    clearStockError 
  } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [bookingEnabled, setBookingEnabled] = useState(false)
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    healthConditions: '',
  })

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        setSiteConfig(data.site)
        setBookingEnabled(data.booking?.enabled || false)
      })
      .catch(() => {})
  }, [])

  const getDeliveryText = () => {
    if (!siteConfig) return ''
    switch (siteConfig.deliveryMode) {
      case 'pickup': return 'Retiro en persona'
      case 'shipping': return 'Envío a domicilio'
      case 'both':
      default: return 'Retiro o envío'
    }
  }

  const isValidForm = () => {
    const baseValid = customerData.name && 
           customerData.email && 
           validateEmail(customerData.email) && 
           customerData.phone && 
           validatePhone(customerData.phone)
    
    if (hasServices) {
      return baseValid && customerData.age && parseInt(customerData.age) > 0
    }
    return baseValid
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (hasServices && bookingEnabled) {
      localStorage.setItem('checkoutData', JSON.stringify({
        items: items.map(i => ({ 
          id: i.product.id,
          name: i.product.name, 
          quantity: i.quantity, 
          price: i.product.price,
          image: i.product.image
        })),
        serviceItems: serviceItems.map(s => ({
          id: s.service.id,
          name: s.service.name,
          quantity: s.quantity,
          price: s.service.price,
          image: s.service.image,
          durationMinutes: s.service.durationMinutes || 60
        })),
        customer: customerData,
      }))
      setIsOpen(false)
      router.push('/checkout/turnos')
      return
    }

    setIsCheckingOut(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: customerData,
        }),
      })

      const data = await response.json()

      if (data.init_point) {
        localStorage.setItem('pendingOrder', JSON.stringify({
          items: items.map(i => ({ 
            id: i.product.id,
            name: i.product.name, 
            quantity: i.quantity, 
            price: i.product.price 
          })),
          customer: customerData,
          total,
        }))
        window.location.href = data.init_point
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error)
      alert('Hubo un error. Por favor, intenta nuevamente.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const isEmpty = items.length === 0 && serviceItems.length === 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-slide-up">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-cream-200">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-rose-500" />
              <h2 className="font-display text-2xl font-semibold text-rose-800">Tu Carrito</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-cream-100 transition-colors"
            >
              <X className="w-5 h-5 text-rose-600" />
            </button>
          </div>

          {stockError && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">{stockError}</p>
              </div>
              <button onClick={clearStockError} className="text-amber-600 hover:text-amber-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {isEmpty ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-cream-300 mx-auto mb-4" />
                <p className="text-rose-700 font-medium">Tu carrito está vacío</p>
                <p className="text-nude-500 text-sm mt-2">
                  ¡Explora nuestros productos y servicios!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-nude-500 uppercase tracking-wide flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Productos
                    </h3>
                    {items.map(({ product, quantity }) => (
                      <div key={product.id} className="flex gap-4 p-4 bg-cream-50 rounded-xl">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
                        ) : (
                          <div className="w-20 h-20 bg-rose-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🧴</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-rose-800">{product.name}</h3>
                          <p className="text-rose-500 font-semibold">{formatPrice(product.price)}</p>
                          {product.trackStock && product.stock !== undefined && (
                            <p className="text-xs text-nude-500 mt-1">
                              <Package className="w-3 h-3 inline mr-1" />
                              {product.stock} disponibles
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1 rounded-full bg-white hover:bg-cream-100 transition-colors">
                              <Minus className="w-4 h-4 text-rose-600" />
                            </button>
                            <span className="w-8 text-center font-medium text-rose-800">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={product.trackStock && product.stock !== undefined && quantity >= product.stock}
                              className="p-1 rounded-full bg-white hover:bg-cream-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4 text-rose-600" />
                            </button>
                            <button onClick={() => removeItem(product.id)} className="ml-auto text-rose-400 hover:text-rose-600 text-sm">
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {serviceItems.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-nude-500 uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Servicios
                    </h3>
                    {serviceItems.map(({ service, quantity }) => (
                      <div key={service.id} className="flex gap-4 p-4 bg-sage-50 rounded-xl">
                        {service.image ? (
                          <img src={service.image} alt={service.name} className="w-20 h-20 object-cover rounded-lg" />
                        ) : (
                          <div className="w-20 h-20 bg-sage-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">💆</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-sage-800">{service.name}</h3>
                          <p className="text-sage-600 font-semibold">{formatPrice(service.price)}</p>
                          <p className="text-xs text-sage-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.durationMinutes || 60} min
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateServiceQuantity(service.id, quantity - 1)} className="p-1 rounded-full bg-white hover:bg-sage-100 transition-colors">
                              <Minus className="w-4 h-4 text-sage-600" />
                            </button>
                            <span className="w-8 text-center font-medium text-sage-800">{quantity}</span>
                            <button onClick={() => updateServiceQuantity(service.id, quantity + 1)} className="p-1 rounded-full bg-white hover:bg-sage-100 transition-colors">
                              <Plus className="w-4 h-4 text-sage-600" />
                            </button>
                            <button onClick={() => removeService(service.id)} className="ml-auto text-sage-400 hover:text-sage-600 text-sm">
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {hasServices && bookingEnabled && (
                      <p className="text-xs text-sage-600 bg-sage-100 rounded-lg p-2">
                        💡 Seleccionarás los turnos en el siguiente paso
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isEmpty && (
              <form onSubmit={handleCheckout} className="mt-8 space-y-4">
                <h3 className="font-display text-lg font-medium text-rose-800">Tus datos</h3>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  required
                  value={customerData.name}
                  onChange={e => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                />
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={customerData.email}
                    onChange={e => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                      customerData.email && !validateEmail(customerData.email)
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50'
                        : 'border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
                    }`}
                  />
                  {customerData.email && !validateEmail(customerData.email) && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Email inválido
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Telefono / WhatsApp"
                    required
                    value={customerData.phone}
                    onChange={e => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                      customerData.phone && !validatePhone(customerData.phone)
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50'
                        : 'border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
                    }`}
                  />
                  {customerData.phone && !validatePhone(customerData.phone) && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Numero invalido (8-15 digitos)
                    </p>
                  )}
                </div>

                {hasServices && (
                  <>
                    <input
                      type="number"
                      placeholder="Edad"
                      required
                      min={1}
                      max={120}
                      value={customerData.age}
                      onChange={e => setCustomerData(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                    />
                    <div>
                      <label className="block text-sm text-nude-600 mb-2">
                        Tenes dolencias, lesiones o patologias?
                      </label>
                      <textarea
                        placeholder="Ej: No / Tengo dolor lumbar / Operacion de rodilla..."
                        value={customerData.healthConditions}
                        onChange={e => setCustomerData(prev => ({ ...prev, healthConditions: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none transition-all resize-none"
                      />
                    </div>
                  </>
                )}

                {items.length > 0 && siteConfig && (
                  <div className="p-3 bg-sage-50 rounded-lg text-sm text-sage-700 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{getDeliveryText()}: coordinamos después del pago</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {!isEmpty && (
            <div className="p-6 border-t border-cream-200 bg-cream-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-rose-700 font-medium">Total</span>
                <span className="text-2xl font-display font-semibold text-rose-800">
                  {formatPrice(total)}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || !isValidForm()}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasServices && bookingEnabled ? (
                  <>
                    <Calendar className="w-5 h-5" />
                    Seleccionar turnos
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {isCheckingOut ? 'Procesando...' : 'Pagar con MercadoPago'}
                  </>
                )}
              </button>
              <div className="flex gap-3 mt-3">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="flex-1 py-2 text-sage-600 hover:text-sage-700 hover:bg-sage-50 rounded-lg transition-colors text-sm font-medium"
                >
                  Seguir comprando
                </button>
                <button 
                  onClick={clearCart} 
                  className="flex-1 py-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-sm"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
