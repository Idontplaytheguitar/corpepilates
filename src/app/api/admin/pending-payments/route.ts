import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/auth'
import { getPendingReservations, getPendingScheduledClasses } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('corpepilates_session')?.value
  if (!token || !(await validateSessionToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const [reservations, classes] = await Promise.all([
    getPendingReservations(),
    getPendingScheduledClasses(),
  ])
  const payments = [
    ...reservations.map(r => ({
      id: r.id, type: 'reservation', name: r.customerName, email: r.customerEmail,
      date: r.date, time: r.time, service: r.serviceName, price: r.servicePrice,
      method: r.paymentMethod || 'unknown', createdAt: r.createdAt,
    })),
    ...classes.map(c => ({
      id: c.id, type: 'scheduled_class', name: c.customerName, email: c.customerEmail,
      date: c.date, time: c.time, service: 'Clase de pack', price: 0,
      method: c.paymentMethod || 'unknown', createdAt: c.createdAt,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return NextResponse.json({ payments, count: payments.length })
}
