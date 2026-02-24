import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/auth'
import { getReservations, saveReservation, getScheduledClasses, saveScheduledClass } from '@/lib/storage'
import { sendPaymentVerifiedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('corpepilates_session')?.value
  if (!token || !(await validateSessionToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, type } = await req.json()

  if (type === 'reservation') {
    const reservations = await getReservations()
    const idx = reservations.findIndex(r => r.id === id)
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    reservations[idx] = { ...reservations[idx], paymentStatus: 'verified', status: 'confirmed' }
    await saveReservation(reservations[idx])
    try {
      await sendPaymentVerifiedEmail(
        reservations[idx].customerEmail,
        reservations[idx].customerName,
        reservations[idx].date,
        reservations[idx].time,
        reservations[idx].serviceName
      )
    } catch {}
    return NextResponse.json({ success: true })
  }

  if (type === 'scheduled_class') {
    const classes = await getScheduledClasses()
    const idx = classes.findIndex(c => c.id === id)
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    classes[idx] = { ...classes[idx], paymentStatus: 'verified' }
    await saveScheduledClass(classes[idx])
    try {
      await sendPaymentVerifiedEmail(
        classes[idx].customerEmail,
        classes[idx].customerName,
        classes[idx].date,
        classes[idx].time,
        'Clase de Pilates Reformer'
      )
    } catch {}
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
}
