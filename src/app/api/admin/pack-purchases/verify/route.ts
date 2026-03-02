import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/auth'
import { getPackPurchaseById, savePackPurchase, getStoredConfig, saveUserPack } from '@/lib/storage'
import type { UserPack } from '@/data/config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('corpepilates_session')?.value
  if (!token || !(await validateSessionToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { purchaseId, action } = body

    if (!purchaseId || (action !== 'verify' && action !== 'reject')) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const purchase = await getPackPurchaseById(purchaseId)
    if (!purchase) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    }

    if (action === 'verify') {
      const config = await getStoredConfig()
      const pack = config.packs.find(p => p.id === purchase.packId)
      if (!pack) {
        return NextResponse.json({ error: 'Pack no encontrado en configuración' }, { status: 404 })
      }

      purchase.status = 'verified'
      purchase.verifiedAt = Date.now()
      await savePackPurchase(purchase)

      const userPack: UserPack = {
        id: `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        packId: pack.id,
        packName: pack.name,
        userId: purchase.userId,
        classesRemaining: purchase.classCount,
        classesUsed: 0,
        expiresAt: Date.now() + pack.validityDays * 86400000,
        purchasedAt: purchase.createdAt,
        status: 'active',
      }
      await saveUserPack(userPack)
    } else {
      purchase.status = 'rejected'
      await savePackPurchase(purchase)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error verifying pack purchase:', error)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
