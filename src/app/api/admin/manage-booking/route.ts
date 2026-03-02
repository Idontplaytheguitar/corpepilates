import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/auth'
import {
  getReservations, saveReservation,
  getScheduledClasses, saveScheduledClass,
  getUserPackById, saveUserPack,
} from '@/lib/storage'
import { sendCancellationEmail, sendRescheduleEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('corpepilates_session')?.value
  if (!token || !(await validateSessionToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, type, action, newDate, newTime } = await req.json()

  if (!id || !type || !action) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  if (action === 'reschedule' && (!newDate || !newTime)) {
    return NextResponse.json({ error: 'Fecha y hora requeridas para reprogramar' }, { status: 400 })
  }

  if (type === 'reservation') {
    const reservations = await getReservations()
    const idx = reservations.findIndex(r => r.id === id)
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const reservation = reservations[idx]

    if (action === 'cancel') {
      reservations[idx] = { ...reservation, status: 'cancelled' }
      await saveReservation(reservations[idx])
      try {
        await sendCancellationEmail(
          reservation.customerEmail,
          reservation.customerName,
          reservation.date,
          reservation.time,
          reservation.serviceName
        )
      } catch {}
      return NextResponse.json({ success: true })
    }

    if (action === 'reschedule') {
      const oldDate = reservation.date
      const oldTime = reservation.time
      reservations[idx] = { ...reservation, date: newDate, time: newTime }
      await saveReservation(reservations[idx])
      try {
        await sendRescheduleEmail(
          reservation.customerEmail,
          reservation.customerName,
          oldDate,
          oldTime,
          newDate,
          newTime,
          reservation.serviceName
        )
      } catch {}
      return NextResponse.json({ success: true })
    }
  }

  if (type === 'scheduled_class') {
    const classes = await getScheduledClasses()
    const idx = classes.findIndex(c => c.id === id)
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const scheduledClass = classes[idx]

    if (action === 'cancel') {
      classes[idx] = { ...scheduledClass, status: 'cancelled' }
      await saveScheduledClass(classes[idx])
      if (scheduledClass.userPackId) {
        const pack = await getUserPackById(scheduledClass.userPackId)
        if (pack) {
          await saveUserPack({ ...pack, classesRemaining: pack.classesRemaining + 1 })
        }
      }
      try {
        await sendCancellationEmail(
          scheduledClass.customerEmail,
          scheduledClass.customerName,
          scheduledClass.date,
          scheduledClass.time,
          'Clase de Pilates Reformer'
        )
      } catch {}
      return NextResponse.json({ success: true })
    }

    if (action === 'reschedule') {
      const oldDate = scheduledClass.date
      const oldTime = scheduledClass.time
      classes[idx] = { ...scheduledClass, date: newDate, time: newTime }
      await saveScheduledClass(classes[idx])
      try {
        await sendRescheduleEmail(
          scheduledClass.customerEmail,
          scheduledClass.customerName,
          oldDate,
          oldTime,
          newDate,
          newTime,
          'Clase de Pilates Reformer'
        )
      } catch {}
      return NextResponse.json({ success: true })
    }
  }

  return NextResponse.json({ error: 'Acción o tipo inválido' }, { status: 400 })
}
