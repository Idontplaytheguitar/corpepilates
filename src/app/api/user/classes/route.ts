import { NextRequest, NextResponse } from 'next/server'
import { getUserSession, getUserById, getScheduledClassesByUserId } from '@/lib/storage'

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
    
    const classes = await getScheduledClassesByUserId(user.id)
    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]
    
    const upcoming = classes
      .filter(c => c.status === 'scheduled' && c.date >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const history = classes
      .filter(c => c.status !== 'scheduled' || c.date < today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return NextResponse.json({
      upcoming,
      history,
    })
  } catch (error) {
    console.error('Error fetching user classes:', error)
    return NextResponse.json({ error: 'Error al obtener clases' }, { status: 500 })
  }
}
