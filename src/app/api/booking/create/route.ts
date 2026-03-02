import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getStoredConfig, saveReservation, getSlotOccupancy, getUserSession } from '@/lib/storage'
import { getValidSellerToken, getSellerCredentials } from '@/lib/marketplace'
import { addMinutes } from '@/data/config'
import type { Reservation } from '@/data/config'
import crypto from 'crypto'

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('user_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Debés iniciar sesión para reservar' }, { status: 401 })
    }
    const session = await getUserSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida. Iniciá sesión nuevamente.' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, date, time, customer, paymentMethod = 'mercadopago' } = body

    if (!serviceId || !date || !time || !customer?.name || !customer?.email) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const config = await getStoredConfig()

    if (!config.booking?.enabled) {
      return NextResponse.json({ error: 'Las reservas no están habilitadas' }, { status: 400 })
    }

    const service = config.services?.find(s => s.id === serviceId)
    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const capacity = config.booking?.bedsCapacity || 4
    const occupancy = await getSlotOccupancy(date, time)
    if (occupancy >= capacity) {
      return NextResponse.json({ error: 'No hay lugares disponibles en este horario' }, { status: 400 })
    }

    const endTime = addMinutes(time, service.durationMinutes || 60)

    const reservationId = crypto.randomUUID()

    const reservation: Reservation = {
      id: reservationId,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      date,
      time,
      endTime,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || '',
      customerAge: customer.age || '',
      customerHealthConditions: customer.healthConditions || '',
      customerDireccion: customer.direccion || '',
      customerObraSocial: customer.obraSocial || '',
      paymentMethod: paymentMethod || 'mercadopago',
      paymentStatus: paymentMethod === 'mercadopago' ? 'paid_online' : 'pending',
      status: paymentMethod === 'mercadopago' ? 'pending' : 'confirmed',
      createdAt: Date.now(),
    }

    await saveReservation(reservation)

    if (paymentMethod === 'mercadopago' && config.site?.mercadopagoEnabled) {
      const seller = await getSellerCredentials()
      const sellerToken = seller ? await getValidSellerToken() : null

      if (!sellerToken) {
        return NextResponse.json(
          { error: 'No hay cuenta de MercadoPago conectada. Contacta al vendedor.' },
          { status: 400 }
        )
      }

      const client = new MercadoPagoConfig({ accessToken: sellerToken })
      const baseUrl = getBaseUrl()
      const preference = new Preference(client)

      const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })

      const preferenceData = await preference.create({
        body: {
          items: [{
            id: service.id,
            title: `Reserva: ${service.name}`,
            description: `${dateFormatted} a las ${time}hs`,
            quantity: 1,
            unit_price: service.price,
            currency_id: 'ARS',
            picture_url: service.image,
          }],
          payer: {
            name: customer.name,
            email: customer.email,
            phone: {
              number: customer.phone || '',
            },
          },
          back_urls: {
            success: `${baseUrl}/reserva/confirmada?id=${reservationId}`,
            failure: `${baseUrl}/reserva/fallida?id=${reservationId}`,
            pending: `${baseUrl}/reserva/pendiente?id=${reservationId}`,
          },
          auto_return: 'approved',
          statement_descriptor: 'CORPEPILATES',
          external_reference: reservationId,
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      })

      return NextResponse.json({
        reservationId,
        init_point: preferenceData.init_point,
        id: reservationId,
      })
    }

    return NextResponse.json({ success: true, id: reservationId })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
