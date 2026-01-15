import { NextRequest, NextResponse } from 'next/server'
import { getSellerCredentials, updateSellerFee, disconnectSeller } from '@/lib/marketplace'
import { validateSessionToken } from '@/lib/auth'

const SESSION_COOKIE_NAME = 'corpepilates_session'

export async function GET() {
  const seller = await getSellerCredentials()
  
  if (!seller) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    userId: seller.userId,
    connectedAt: seller.connectedAt,
    feeEnabled: seller.feeEnabled,
    feePercentage: seller.feePercentage,
  })
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const isSessionValid = sessionToken ? await validateSessionToken(sessionToken) : false
  
  if (!isSessionValid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { action, feeEnabled, feePercentage } = body

  if (action === 'disconnect') {
    await disconnectSeller()
    return NextResponse.json({ success: true })
  }

  if (action === 'updateFee') {
    const success = await updateSellerFee(feeEnabled, feePercentage)
    return NextResponse.json({ success })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
