import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserSession, 
  getUserById, 
  getScheduledClassById,
  saveScheduledClass,
  getUserPackById,
  saveUserPack
} from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    const { classId } = body
    
    if (!classId) {
      return NextResponse.json({ error: 'Clase no especificada' }, { status: 400 })
    }
    
    const scheduledClass = await getScheduledClassById(classId)
    if (!scheduledClass) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }
    
    if (scheduledClass.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    
    if (scheduledClass.status !== 'scheduled') {
      return NextResponse.json({ error: 'Esta clase no puede ser cancelada' }, { status: 400 })
    }
    
    const classDate = new Date(scheduledClass.date + 'T' + scheduledClass.time)
    const now = new Date()
    const hoursUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilClass < 24) {
      return NextResponse.json({ 
        error: 'Las clases solo pueden cancelarse con 24 horas de anticipación' 
      }, { status: 400 })
    }
    
    scheduledClass.status = 'cancelled'
    await saveScheduledClass(scheduledClass)
    
    if (scheduledClass.userPackId) {
      const userPack = await getUserPackById(scheduledClass.userPackId)
      if (userPack && userPack.status !== 'expired') {
        userPack.classesRemaining += 1
        userPack.classesUsed -= 1
        if (userPack.status === 'exhausted' && userPack.classesRemaining > 0) {
          userPack.status = 'active'
        }
        await saveUserPack(userPack)
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Clase cancelada. La clase fue devuelta a tu pack.',
    })
  } catch (error) {
    console.error('Error cancelling class:', error)
    return NextResponse.json({ error: 'Error al cancelar clase' }, { status: 500 })
  }
}
