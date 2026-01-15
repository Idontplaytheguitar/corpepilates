import { NextResponse } from 'next/server'
import { getReservations } from '@/lib/storage'

export async function GET() {
  try {
    const reservations = await getReservations()
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'pending')
    
    return NextResponse.json({ reservations: confirmedReservations })
  } catch (error) {
    console.error('Error getting reservations:', error)
    return NextResponse.json({ reservations: [] })
  }
}
