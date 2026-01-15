'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Heart, ArrowLeft, MessageCircle, Package, Truck, Calendar, Clock, Mail } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { SiteConfig } from '@/data/config'
import { formatPrice } from '@/data/config'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface ServiceItem {
  id?: string
  name: string
  quantity: number
  price: number
}

interface SelectedSlot {
  serviceId: string
  date: string
  time: string
}

interface OrderData {
  items?: OrderItem[]
  serviceItems?: ServiceItem[]
  selectedSlots?: SelectedSlot[]
  customer: { name: string; email: string; phone: string }
  total: number
}

export default function SuccessPage() {
  const { clearCart } = useCart()
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)

  useEffect(() => {
    clearCart()
    
    const stored = localStorage.getItem('pendingOrder')
    if (stored) {
      const order = JSON.parse(stored)
      setOrderData(order)
      localStorage.removeItem('pendingOrder')
      
      if (order.items && order.items.length > 0) {
        const stockUpdates = order.items.map((item: OrderItem & { id?: string }) => ({
          productId: item.id,
          quantity: item.quantity
        })).filter((item: { productId?: string }) => item.productId)
        
        if (stockUpdates.length > 0) {
          fetch('/api/stock/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: stockUpdates })
          }).catch(() => {})
        }
      }

      fetch('/api/order/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      }).catch(() => {})
    }

    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => setSiteConfig(data.site))
      .catch(() => {})
  }, [clearCart])

  const hasProducts = orderData?.items && orderData.items.length > 0
  const hasServices = orderData?.serviceItems && orderData.serviceItems.length > 0

  const getDeliveryOptions = () => {
    if (!siteConfig) return { text: '', icon: Package }
    switch (siteConfig.deliveryMode) {
      case 'pickup': return { text: 'Coordinemos el retiro de tu pedido', icon: Package }
      case 'shipping': return { text: 'Coordinemos el envío de tu pedido', icon: Truck }
      case 'both':
      default: return { text: 'Coordinemos la entrega de tu pedido', icon: Package }
    }
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const buildWhatsAppMessage = () => {
    if (!orderData || !siteConfig) return ''
    
    let message = `¡Hola! Acabo de realizar una compra en ${siteConfig.siteName}.\n\n`
    
    if (hasProducts) {
      message += `*Productos:*\n`
      orderData.items!.forEach(item => {
        message += `• ${item.name} x${item.quantity}\n`
      })
      message += `\n`
    }
    
    if (hasServices) {
      message += `*Servicios reservados:*\n`
      orderData.serviceItems!.forEach(item => {
        message += `• ${item.name} x${item.quantity}\n`
      })
      if (orderData.selectedSlots && orderData.selectedSlots.length > 0) {
        message += `\n*Turnos:*\n`
        orderData.selectedSlots.forEach(slot => {
          message += `📅 ${formatDateDisplay(slot.date)} a las ${slot.time}\n`
        })
      }
      message += `\n`
    }
    
    message += `*Total:* ${formatPrice(orderData.total)}\n\n`
    
    message += `*Mis datos:*\n`
    message += `Nombre: ${orderData.customer.name}\n`
    message += `Email: ${orderData.customer.email}\n`
    message += `Tel: ${orderData.customer.phone}\n\n`
    
    if (hasProducts && !hasServices) {
      switch (siteConfig.deliveryMode) {
        case 'pickup':
          message += `Quisiera coordinar el retiro del pedido. ¿Cuándo podría pasar a buscarlo?`
          break
        case 'shipping':
          message += `Quisiera coordinar el envío. ¿Qué datos necesitan?`
          break
        default:
          message += `¿Cuáles son las opciones para retirar o recibir mi pedido?`
      }
    } else if (hasServices && !hasProducts) {
      message += `¡Quedaron confirmados mis turnos! ¿Hay algo que deba llevar o tener en cuenta?`
    } else {
      message += `¡Gracias! Quisiera coordinar la entrega de los productos y confirmar los turnos.`
    }
    
    return encodeURIComponent(message)
  }

  const buildEmailMessage = () => {
    if (!orderData || !siteConfig) return ''
    
    let subject = `Compra realizada - ${siteConfig.siteName}`
    let body = `Hola!\n\nAcabo de realizar una compra.\n\n`
    
    if (hasProducts) {
      body += `Productos:\n`
      orderData.items!.forEach(item => {
        body += `- ${item.name} x${item.quantity}\n`
      })
      body += `\n`
    }
    
    if (hasServices) {
      body += `Servicios:\n`
      orderData.serviceItems!.forEach(item => {
        body += `- ${item.name} x${item.quantity}\n`
      })
      if (orderData.selectedSlots && orderData.selectedSlots.length > 0) {
        body += `\nTurnos:\n`
        orderData.selectedSlots.forEach(slot => {
          body += `- ${formatDateDisplay(slot.date)} a las ${slot.time}\n`
        })
      }
      body += `\n`
    }
    
    body += `Total: ${formatPrice(orderData.total)}\n\n`
    body += `Mis datos:\nNombre: ${orderData.customer.name}\nEmail: ${orderData.customer.email}\nTel: ${orderData.customer.phone}\n\n`
    body += `¡Gracias!`
    
    return `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const deliveryInfo = getDeliveryOptions()
  const DeliveryIcon = deliveryInfo.icon

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 pt-24 pb-12">
      <div className="max-w-md w-full text-center">
        <div className="animate-fade-in">
          <div className="w-24 h-24 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-sage-500" />
          </div>

          <h1 className="font-display text-4xl font-semibold text-rose-800 mb-4">
            ¡Gracias por tu compra!
          </h1>

          <p className="text-nude-600 mb-6 leading-relaxed">
            Tu pago ha sido procesado exitosamente.
          </p>

          {hasServices && orderData?.selectedSlots && orderData.selectedSlots.length > 0 && (
            <div className="p-4 bg-sage-50 rounded-xl mb-6 border border-sage-200 text-left">
              <h3 className="font-medium text-sage-800 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Tus turnos confirmados
              </h3>
              <div className="space-y-2">
                {orderData.selectedSlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <Clock className="w-4 h-4 text-sage-500" />
                    <span className="text-sm text-sage-700">
                      {formatDateDisplay(slot.date)} • {slot.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {siteConfig && (siteConfig.whatsapp || siteConfig.email) && (
            <div className="p-6 bg-cream-50 rounded-2xl mb-6 border border-cream-200">
              {hasProducts && (
                <>
                  <div className="flex items-center justify-center gap-2 text-rose-700 mb-3">
                    <DeliveryIcon className="w-5 h-5" />
                    <span className="font-medium">{deliveryInfo.text}</span>
                  </div>
                  <p className="text-sm text-nude-600 mb-4">
                    {siteConfig.deliveryMode === 'pickup' && 'Escribinos para acordar día y horario de retiro.'}
                    {siteConfig.deliveryMode === 'shipping' && 'Escribinos para coordinar el envío a tu domicilio.'}
                    {siteConfig.deliveryMode === 'both' && 'Ofrecemos retiro en persona o envío. ¡Elegí lo que más te convenga!'}
                  </p>
                </>
              )}
              {!hasProducts && hasServices && (
                <>
                  <p className="font-medium text-rose-700 mb-2">¿Tenés alguna consulta?</p>
                  <p className="text-sm text-nude-600 mb-4">Estamos para ayudarte</p>
                </>
              )}
              <div className="space-y-3">
                {siteConfig.whatsapp && (
                  <a
                    href={`https://wa.me/${siteConfig.whatsapp}?text=${buildWhatsAppMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-colors w-full"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contactar por WhatsApp
                  </a>
                )}
                {siteConfig.email && (
                  <a
                    href={buildEmailMessage()}
                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-rose-200 text-rose-600 rounded-full font-medium hover:bg-rose-50 transition-colors w-full"
                  >
                    <Mail className="w-5 h-5" />
                    Contactar por Email
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="p-6 bg-rose-50 rounded-2xl mb-8">
            <div className="flex items-center justify-center gap-2 text-rose-600 mb-2">
              <Heart className="w-5 h-5 fill-rose-400" />
              <span className="font-medium">Gracias por confiar en {siteConfig?.siteName || 'nosotros'}</span>
            </div>
            <p className="text-sm text-nude-500">
              {hasServices ? 'Te esperamos con todo listo para tu cita.' : 'Cada producto está hecho con amor especialmente para vos.'}
            </p>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
