import { NextRequest, NextResponse } from 'next/server'
import { getReservationById, saveReservation, getStoredConfig } from '@/lib/storage'
import { formatPrice } from '@/data/config'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reservationId, paymentId } = body

    if (!reservationId) {
      return NextResponse.json({ error: 'ID de reserva requerido' }, { status: 400 })
    }

    const reservation = await getReservationById(reservationId)
    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    reservation.status = 'confirmed'
    if (paymentId) {
      reservation.paymentId = paymentId
    }

    await saveReservation(reservation)

    const config = await getStoredConfig()

    const dateFormatted = new Date(reservation.date + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const locationInfo = config.site.location 
      ? `<p><strong>📍 Ubicación:</strong> ${config.site.location}</p>` 
      : ''

    const adminEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #be185d;">🎉 Nueva Reserva Confirmada</h2>
        <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #9f1239; margin-top: 0;">${reservation.serviceName}</h3>
          <p><strong>📅 Fecha:</strong> ${dateFormatted}</p>
          <p><strong>🕐 Horario:</strong> ${reservation.time} - ${reservation.endTime}</p>
          <p><strong>💰 Precio:</strong> ${formatPrice(reservation.servicePrice)}</p>
          ${locationInfo}
        </div>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px;">
          <h4 style="margin-top: 0;">Datos del cliente:</h4>
          <p><strong>Nombre:</strong> ${reservation.customerName}</p>
          <p><strong>Email:</strong> ${reservation.customerEmail}</p>
          <p><strong>Telefono:</strong> ${reservation.customerPhone}</p>
          ${reservation.customerAge ? `<p><strong>Edad:</strong> ${reservation.customerAge} anos</p>` : ''}
          ${reservation.customerHealthConditions ? `<p><strong>Condiciones de salud:</strong> ${reservation.customerHealthConditions}</p>` : ''}
        </div>
      </div>
    `

    const customerEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #be185d;">✅ Reserva Confirmada</h2>
        <p>¡Hola ${reservation.customerName}!</p>
        <p>Tu reserva ha sido confirmada. Te esperamos:</p>
        <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #9f1239; margin-top: 0;">${reservation.serviceName}</h3>
          <p><strong>📅 Fecha:</strong> ${dateFormatted}</p>
          <p><strong>🕐 Horario:</strong> ${reservation.time}hs</p>
          ${locationInfo}
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Si necesitás cancelar o reprogramar tu turno, contactanos por WhatsApp al ${config.site.whatsapp}.
        </p>
        <p style="margin-top: 30px;">¡Nos vemos pronto! 💕</p>
        <p><strong>${config.site.siteName}</strong></p>
      </div>
    `

    if (config.site.email) {
      await sendEmail(config.site.email, `Nueva reserva: ${reservation.serviceName} - ${dateFormatted}`, adminEmailHtml)
    }

    await sendEmail(reservation.customerEmail, `Tu reserva está confirmada - ${config.site.siteName}`, customerEmailHtml)

    return NextResponse.json({ success: true, reservation })
  } catch (error) {
    console.error('Error confirming reservation:', error)
    return NextResponse.json({ error: 'Error al confirmar la reserva' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('id')

    if (!reservationId) {
      return NextResponse.json({ error: 'ID de reserva requerido' }, { status: 400 })
    }

    const reservation = await getReservationById(reservationId)
    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error('Error getting reservation:', error)
    return NextResponse.json({ error: 'Error al obtener la reserva' }, { status: 500 })
  }
}
