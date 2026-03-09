import { NextRequest, NextResponse } from 'next/server'
import {
  getUserSession,
  getUserById,
  getScheduledClassById,
  saveScheduledClass,
  getReservationsByDate,
  getScheduledClassesByDate,
  getOrders,
  getStoredConfig,
} from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Auth (same as cancel route)
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

    const { classId, newDate, newTime } = await request.json()
    if (!classId || !newDate || !newTime) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const scheduledClass = await getScheduledClassById(classId)
    if (!scheduledClass) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }
    if (scheduledClass.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (scheduledClass.status !== 'scheduled') {
      return NextResponse.json({ error: 'Esta clase no puede ser reprogramada' }, { status: 400 })
    }

    // 24h rule
    const classDate = new Date(scheduledClass.date + 'T' + scheduledClass.time)
    const now = new Date()
    const hoursUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursUntilClass < 24) {
      return NextResponse.json({
        error: 'Las clases solo pueden reprogramarse con 24 horas de anticipación'
      }, { status: 400 })
    }

    // Validate new date is future
    const newDateObj = new Date(newDate + 'T' + newTime)
    if (newDateObj <= now) {
      return NextResponse.json({ error: 'La nueva fecha debe ser futura' }, { status: 400 })
    }

    // Check slot availability
    const config = await getStoredConfig()
    if (!config.booking?.enabled) {
      return NextResponse.json({ error: 'Las reservas no están habilitadas' }, { status: 400 })
    }
    const bedsCapacity = config.booking.bedsCapacity || 1

    const dayOfWeek = new Date(newDate + 'T12:00:00').getDay()
    const recurring = config.booking.recurring?.find(r => r.dayOfWeek === dayOfWeek)
    if (!recurring || recurring.slots.length === 0) {
      return NextResponse.json({ error: 'No hay atención ese día' }, { status: 400 })
    }

    const exception = config.booking.exceptions?.find(e => e.date === newDate)
    if (exception?.isBlocked) {
      return NextResponse.json({ error: 'Esa fecha está bloqueada' }, { status: 400 })
    }

    // Check occupancy (exclude this class since it's moving)
    const existingReservations = await getReservationsByDate(newDate)
    const scheduledClasses = await getScheduledClassesByDate(newDate)
    const orders = await getOrders()

    let occupancy = 0
    occupancy += existingReservations.filter(r => r.time === newTime && r.status === 'confirmed').length
    occupancy += scheduledClasses.filter(c => c.time === newTime && c.status === 'scheduled' && c.id !== classId).length
    occupancy += orders.flatMap(o =>
      (o.selectedSlots || []).filter((s: { date: string; time: string; status?: string }) =>
        s.date === newDate && s.time === newTime && s.status !== 'absent' && s.status !== 'completed'
      )
    ).length

    if (occupancy >= bedsCapacity) {
      return NextResponse.json({ error: 'No hay lugar disponible en ese horario' }, { status: 400 })
    }

    // Perform reschedule
    const oldDate = scheduledClass.date
    const oldTime = scheduledClass.time

    scheduledClass.date = newDate
    scheduledClass.time = newTime
    scheduledClass.rescheduledFrom = { date: oldDate, time: oldTime }
    scheduledClass.history = [
      ...(scheduledClass.history || []),
      {
        action: 'rescheduled' as const,
        by: 'user' as const,
        at: Date.now(),
        details: `Reprogramada por el usuario de ${oldDate} ${oldTime} a ${newDate} ${newTime}`,
      }
    ]

    await saveScheduledClass(scheduledClass)

    return NextResponse.json({
      success: true,
      message: `Clase reprogramada para ${newDate} a las ${newTime}`,
    })
  } catch (error) {
    console.error('Error rescheduling class:', error)
    return NextResponse.json({ error: 'Error al reprogramar clase' }, { status: 500 })
  }
}
