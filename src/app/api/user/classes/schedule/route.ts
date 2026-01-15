import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserSession, 
  getUserById, 
  getUserPackById, 
  saveUserPack,
  saveScheduledClass,
  getSlotOccupancy,
  getStoredConfig
} from '@/lib/storage'
import { addMinutes, ScheduledClass } from '@/data/config'

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
    const { userPackId, date, time } = body
    
    if (!userPackId || !date || !time) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    
    const userPack = await getUserPackById(userPackId)
    if (!userPack) {
      return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 })
    }
    
    if (userPack.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    
    const now = Date.now()
    if (userPack.status !== 'active') {
      return NextResponse.json({ error: 'El pack no está activo' }, { status: 400 })
    }
    
    if (userPack.expiresAt < now) {
      userPack.status = 'expired'
      await saveUserPack(userPack)
      return NextResponse.json({ error: 'El pack ha expirado' }, { status: 400 })
    }
    
    if (userPack.classesRemaining <= 0) {
      userPack.status = 'exhausted'
      await saveUserPack(userPack)
      return NextResponse.json({ error: 'No te quedan clases en este pack' }, { status: 400 })
    }
    
    const config = await getStoredConfig()
    const bedsCapacity = config.booking?.bedsCapacity || 1
    const currentOccupancy = await getSlotOccupancy(date, time)
    
    if (currentOccupancy >= bedsCapacity) {
      return NextResponse.json({ error: 'Este horario ya está completo' }, { status: 400 })
    }
    
    const durationMinutes = 60
    const endTime = addMinutes(time, durationMinutes)
    
    const scheduledClass: ScheduledClass = {
      id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userPackId: userPack.id,
      date,
      time,
      endTime,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: '',
      status: 'scheduled',
      createdAt: now,
    }
    
    await saveScheduledClass(scheduledClass)
    
    userPack.classesRemaining -= 1
    userPack.classesUsed += 1
    if (userPack.classesRemaining <= 0) {
      userPack.status = 'exhausted'
    }
    await saveUserPack(userPack)
    
    return NextResponse.json({ 
      success: true, 
      class: scheduledClass,
      classesRemaining: userPack.classesRemaining,
    })
  } catch (error) {
    console.error('Error scheduling class:', error)
    return NextResponse.json({ error: 'Error al agendar clase' }, { status: 500 })
  }
}
