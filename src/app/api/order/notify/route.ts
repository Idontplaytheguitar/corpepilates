import { NextRequest, NextResponse } from 'next/server'
import { getStoredConfig, saveOrder, Order } from '@/lib/storage'
import { sendEmail } from '@/lib/email'
import { formatPrice } from '@/data/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, serviceItems, selectedSlots, customer, total } = body

    if (!customer?.name || !customer?.email) {
      return NextResponse.json({ error: 'Datos del cliente incompletos' }, { status: 400 })
    }

    const config = await getStoredConfig()
    const siteName = config.site?.siteName || 'Corpe Pilates'

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const order: Order = {
      id: orderId,
      items: items || [],
      serviceItems: serviceItems || [],
      selectedSlots: selectedSlots || [],
      customer,
      total,
      status: 'confirmed',
      deliveryStatus: (items && items.length > 0) ? 'pending' : undefined,
      createdAt: Date.now(),
    }

    await saveOrder(order)

    let itemsHtml = ''
    if (items && items.length > 0) {
      itemsHtml += '<h4 style="margin: 15px 0 10px;">Productos:</h4><ul>'
      items.forEach((item: { name: string; quantity: number; price: number }) => {
        itemsHtml += `<li>${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}</li>`
      })
      itemsHtml += '</ul>'
    }

    if (serviceItems && serviceItems.length > 0) {
      itemsHtml += '<h4 style="margin: 15px 0 10px;">Servicios:</h4><ul>'
      serviceItems.forEach((item: { name: string; quantity: number; price: number }) => {
        itemsHtml += `<li>${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}</li>`
      })
      itemsHtml += '</ul>'
    }

    if (selectedSlots && selectedSlots.length > 0) {
      itemsHtml += '<h4 style="margin: 15px 0 10px;">Turnos reservados:</h4><ul>'
      selectedSlots.forEach((slot: { date: string; time: string }) => {
        const dateFormatted = new Date(slot.date + 'T12:00:00').toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        itemsHtml += `<li>📅 ${dateFormatted} a las ${slot.time}</li>`
      })
      itemsHtml += '</ul>'
    }

    const adminEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #be185d;">🎉 Nueva Compra</h2>
        <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0;">
          ${itemsHtml}
          <p style="font-size: 18px; font-weight: bold; margin-top: 15px;">Total: ${formatPrice(total)}</p>
        </div>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px;">
          <h4 style="margin-top: 0;">Datos del cliente:</h4>
          <p><strong>Nombre:</strong> ${customer.name}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Telefono:</strong> ${customer.phone}</p>
          ${customer.age ? `<p><strong>Edad:</strong> ${customer.age} anos</p>` : ''}
          ${customer.healthConditions ? `<p><strong>Condiciones de salud:</strong> ${customer.healthConditions}</p>` : ''}
        </div>
      </div>
    `

    const locationHtml = config.site.location 
      ? `<div style="background: #f0fdf4; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #166534;"><strong>📍 Ubicación:</strong> ${config.site.location}</p>
        </div>` 
      : ''

    const customerEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #be185d;">✅ ¡Gracias por tu compra!</h2>
        <p>¡Hola ${customer.name}!</p>
        <p>Tu pago fue procesado exitosamente. Acá está el detalle:</p>
        <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0;">
          ${itemsHtml}
          <p style="font-size: 18px; font-weight: bold; margin-top: 15px;">Total: ${formatPrice(total)}</p>
        </div>
        ${locationHtml}
        <p style="color: #64748b; font-size: 14px;">
          Si tenés alguna consulta, escribinos por WhatsApp al ${config.site.whatsapp || 'nuestro número de contacto'}.
        </p>
        <p style="margin-top: 30px;">¡Gracias por tu confianza! 💕</p>
        <p><strong>${siteName}</strong></p>
      </div>
    `

    if (config.site.email) {
      await sendEmail(config.site.email, `Nueva compra - ${formatPrice(total)}`, adminEmailHtml)
    }

    await sendEmail(customer.email, `¡Gracias por tu compra! - ${siteName}`, customerEmailHtml)

    return NextResponse.json({ success: true, orderId })
  } catch (error) {
    console.error('Error processing order notification:', error)
    return NextResponse.json({ error: 'Error al procesar la notificación' }, { status: 500 })
  }
}
