import { NextRequest, NextResponse } from 'next/server'
import { getUserSession, getUserById, getPackPurchases } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('user_session')?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const session = await getUserSession(sessionToken)
  if (!session) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
  }

  const user = await getUserById(session.userId)
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
  }

  const all = await getPackPurchases()
  const purchases = all
    .filter(p => p.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt)

  return NextResponse.json({ purchases })
}
