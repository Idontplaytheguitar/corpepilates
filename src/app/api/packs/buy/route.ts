import { NextRequest, NextResponse } from 'next/server'
import { getStoredConfig, getUserSession, getUserById, savePackPurchase } from '@/lib/storage'
import type { PackPurchase } from '@/data/config'

export const dynamic = 'force-dynamic'

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
    const { packId, paymentMethod } = body

    if (!packId) {
      return NextResponse.json({ error: 'Pack no especificado' }, { status: 400 })
    }

    if (paymentMethod !== 'alias' && paymentMethod !== 'efectivo') {
      return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 })
    }

    const config = await getStoredConfig()
    const pack = (config.packs || []).find(p => p.id === packId && !p.paused)

    if (!pack) {
      return NextResponse.json({ error: 'Pack no encontrado o no disponible' }, { status: 404 })
    }

    const purchaseId = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const purchase: PackPurchase = {
      id: purchaseId,
      packId: pack.id,
      packName: pack.name,
      classCount: pack.classCount,
      price: pack.price,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      paymentMethod,
      status: 'pending',
      createdAt: Date.now(),
    }

    await savePackPurchase(purchase)

    return NextResponse.json({ success: true, purchaseId })
  } catch (error) {
    console.error('Error creating pack purchase:', error)
    return NextResponse.json({ error: 'Error al procesar la compra' }, { status: 500 })
  }
}
