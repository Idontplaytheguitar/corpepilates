import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getStoredConfig, saveReservation, getReservationsByDate } from '@/lib/storage'
import { getValidSellerToken, getSellerCredentials } from '@/lib/marketplace'
import { getFeeStatus } from '@/lib/fee'
import { addMinutes } from '@/data/config'
import type { Reservation } from '@/data/config'

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, date, time, customer } = body

    if (!serviceId || !date || !time || !customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const config = await getStoredConfig()
    
    if (!config.booking?.enabled) {
      return NextResponse.json({ error: 'Las reservas no están habilitadas' }, { status: 400 })
    }

    const service = config.services.find(s => s.id === serviceId)
    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 400 })
    }

    const endTime = addMinutes(time, service.durationMinutes || 60)

    const existingReservations = await getReservationsByDate(date)
    const isTimeReserved = existingReservations.some(r => {
      if (r.status === 'cancelled') return false
      return r.time === time
    })
    
    if (isTimeReserved) {
      return NextResponse.json({ error: 'Este horario ya fue reservado' }, { status: 400 })
    }

    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
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
      customerPhone: customer.phone,
      customerAge: customer.age,
      customerHealthConditions: customer.healthConditions,
      status: 'pending',
      createdAt: Date.now(),
    }

    await saveReservation(reservation)

    const seller = await getSellerCredentials()
    const sellerToken = seller ? await getValidSellerToken() : null
    
    if (!sellerToken) {
      return NextResponse.json(
        { error: 'No hay cuenta de MercadoPago conectada. Contacta al vendedor.' },
        { status: 400 }
      )
    }

    const accessToken = sellerToken
    
    const client = new MercadoPagoConfig({ accessToken })
    const baseUrl = getBaseUrl()
    const preference = new Preference(client)

    const feeStatus = await getFeeStatus()
    const marketplaceFee = feeStatus.enabled 
      ? Math.round(service.price * (feeStatus.percentage / 100))
      : 0

    const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
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
            number: customer.phone,
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
        ...(marketplaceFee > 0 && { marketplace_fee: marketplaceFee }),
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    })

    return NextResponse.json({
      reservationId,
      init_point: preferenceData.init_point,
    })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 })
  }
}
