import { NextRequest, NextResponse } from 'next/server'
import { getUserSession, getUserById, getUserPacksByUserId } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('user_session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    
    const session = await getUserSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }
    
    const user = await getUserById(session.userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }
    
    const allPacks = await getUserPacksByUserId(user.id)
    const now = Date.now()
    
    const packs = allPacks.map(pack => {
      let status = pack.status
      if (status === 'active') {
        if (pack.expiresAt < now) {
          status = 'expired'
        } else if (pack.classesRemaining <= 0) {
          status = 'exhausted'
        }
      }
      return { ...pack, status }
    })
    
    const activePacks = packs.filter(p => p.status === 'active')
    const historyPacks = packs.filter(p => p.status !== 'active')
    
    return NextResponse.json({
      active: activePacks,
      history: historyPacks,
    })
  } catch (error) {
    console.error('Error fetching user packs:', error)
    return NextResponse.json({ error: 'Error al obtener packs' }, { status: 500 })
  }
}
