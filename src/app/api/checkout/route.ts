import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getSellerCredentials, getValidSellerToken } from '@/lib/marketplace'
import { getFeeStatus } from '@/lib/fee'

interface ProductItem {
  product?: { id: string; name: string; price: number; image?: string }
  id?: string
  name?: string
  price?: number
  image?: string
  quantity: number
}

interface ServiceItem {
  id: string
  name: string
  price: number
  image?: string
  quantity: number
  selectedSlots?: { date: string; time: string }[]
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items = [], serviceItems = [], customer } = body

    if (items.length === 0 && serviceItems.length === 0) {
      return NextResponse.json(
        { error: 'No hay productos ni servicios en el carrito' },
        { status: 400 }
      )
    }

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

    const productTotal = items.reduce(
      (sum: number, item: ProductItem) => {
        const price = item.product?.price ?? item.price ?? 0
        return sum + price * item.quantity
      },
      0
    )

    const serviceTotal = serviceItems.reduce(
      (sum: number, item: ServiceItem) => sum + item.price * item.quantity,
      0
    )

    const total = productTotal + serviceTotal

    const feeStatus = await getFeeStatus()
    const marketplaceFee = feeStatus.enabled 
      ? Math.round(total * (feeStatus.percentage / 100))
      : 0

    const mpItems = [
      ...items.map((item: ProductItem) => ({
        id: item.product?.id ?? item.id ?? 'product',
        title: item.product?.name ?? item.name ?? 'Producto',
        quantity: item.quantity,
        unit_price: item.product?.price ?? item.price ?? 0,
        currency_id: 'ARS',
        picture_url: item.product?.image ?? item.image,
      })),
      ...serviceItems.map((item: ServiceItem) => ({
        id: item.id,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'ARS',
        picture_url: item.image,
      })),
    ]

    const externalRef = JSON.stringify({
      orderId: `order_${Date.now()}`,
      serviceItems: serviceItems.map((s: ServiceItem) => ({
        id: s.id,
        name: s.name,
        slots: s.selectedSlots || []
      })),
      customer
    })

    const preferenceData = await preference.create({
      body: {
        items: mpItems,
        payer: {
          name: customer.name,
          email: customer.email,
          phone: {
            number: customer.phone,
          },
        },
        back_urls: {
          success: `${baseUrl}/success`,
          failure: `${baseUrl}/failure`,
          pending: `${baseUrl}/pending`,
        },
        auto_return: 'approved',
        statement_descriptor: 'CORPEPILATES',
        external_reference: externalRef,
        ...(marketplaceFee > 0 && { marketplace_fee: marketplaceFee }),
      },
    })

    return NextResponse.json({
      id: preferenceData.id,
      init_point: preferenceData.init_point,
    })
  } catch (error) {
    console.error('Error creating preference:', error)
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago' },
      { status: 500 }
    )
  }
}
