import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export async function POST() {
  try {
    const baseUrl = getBaseUrl()
    const preference = new Preference(client)

    const preferenceData = await preference.create({
      body: {
        items: [{
          id: 'desarrollo-corpepilates',
          title: 'Desarrollo de Tienda Corpe Pilates',
          description: 'Pago único por desarrollo de la tienda online - Elimina la comisión del 5%',
          quantity: 1,
          unit_price: 300000,
          currency_id: 'ARS',
        }],
        back_urls: {
          success: `${baseUrl}/admin?dev_payment=success`,
          failure: `${baseUrl}/admin?dev_payment=failure`,
          pending: `${baseUrl}/admin?dev_payment=pending`,
        },
        auto_return: 'approved',
        statement_descriptor: 'CORPEPILATES DEV',
        external_reference: `dev_payment_${Date.now()}`,
      },
    })

    return NextResponse.json({
      id: preferenceData.id,
      init_point: preferenceData.init_point,
    })
  } catch (error) {
    console.error('Error creating development payment:', error)
    return NextResponse.json(
      { error: 'Error al crear el pago' },
      { status: 500 }
    )
  }
}
