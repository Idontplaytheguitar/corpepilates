import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getSellerCredentials, getValidSellerToken } from '@/lib/marketplace'
import { getStoredConfig, getUserSession, getUserById } from '@/lib/storage'
import { getFeeStatus } from '@/lib/fee'
import type { PackConfig } from '@/data/config'

export const dynamic = 'force-dynamic'

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('user_session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Debes iniciar sesión para comprar un pack' }, { status: 401 })
    }
    
    const session = await getUserSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }
    
    const user = await getUserById(session.userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { packId } = body
    
    if (!packId) {
      return NextResponse.json({ error: 'Pack no especificado' }, { status: 400 })
    }
    
    const config = await getStoredConfig()
    const pack = (config.packs || []).find((p: PackConfig) => p.id === packId && !p.paused)
    
    if (!pack) {
      return NextResponse.json({ error: 'Pack no encontrado o no disponible' }, { status: 404 })
    }
    
    if (!config.site.mercadopagoEnabled) {
      return NextResponse.json({ error: 'Los pagos no están habilitados' }, { status: 400 })
    }
    
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
    
    const feeStatus = await getFeeStatus()
    const marketplaceFee = feeStatus.enabled 
      ? Math.round(pack.price * (feeStatus.percentage / 100))
      : 0
    
    const purchaseId = `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const externalRef = JSON.stringify({
      type: 'pack_purchase',
      purchaseId,
      packId: pack.id,
      packName: pack.name,
      classCount: pack.classCount,
      validityDays: pack.validityDays,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    })
    
    const preferenceData = await preference.create({
      body: {
        items: [{
          id: pack.id,
          title: `${pack.name} - ${pack.classCount} clases`,
          quantity: 1,
          unit_price: pack.price,
          currency_id: 'ARS',
          picture_url: pack.image,
        }],
        payer: {
          name: user.name,
          email: user.email,
        },
        back_urls: {
          success: `${baseUrl}/mi-cuenta?pack_success=true`,
          failure: `${baseUrl}/packs?pack_error=payment_failed`,
          pending: `${baseUrl}/mi-cuenta?pack_pending=true`,
        },
        auto_return: 'approved',
        statement_descriptor: 'CORPEPILATES',
        external_reference: externalRef,
        notification_url: `${baseUrl}/api/packs/notify`,
        ...(marketplaceFee > 0 && { marketplace_fee: marketplaceFee }),
      },
    })
    
    return NextResponse.json({
      id: preferenceData.id,
      init_point: preferenceData.init_point,
    })
  } catch (error) {
    console.error('Error creating pack purchase:', error)
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago' },
      { status: 500 }
    )
  }
}
