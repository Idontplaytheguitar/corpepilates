import { NextRequest, NextResponse } from 'next/server'
import { getStoredConfig, getReservationsByDate, getScheduledClassesByDate, getOrders } from '@/lib/storage'
import { parseTime, formatTime } from '@/data/config'
import type { TimeSlot } from '@/data/config'

export const dynamic = 'force-dynamic'

function subtractBlockedSlots(recurring: TimeSlot[], blocked: TimeSlot[]): TimeSlot[] {
  if (blocked.length === 0) return recurring

  const INTERVAL = 30
  const intervals: boolean[] = new Array(48).fill(false)

  for (const slot of recurring) {
    const start = parseTime(slot.start) / INTERVAL
    const end = parseTime(slot.end) / INTERVAL
    for (let i = start; i < end && i < 48; i++) {
      intervals[i] = true
    }
  }

  for (const slot of blocked) {
    const start = parseTime(slot.start) / INTERVAL
    const end = parseTime(slot.end) / INTERVAL
    for (let i = start; i < end && i < 48; i++) {
      intervals[i] = false
    }
  }

  const result: TimeSlot[] = []
  let startIdx: number | null = null

  for (let i = 0; i <= 48; i++) {
    if (intervals[i] && startIdx === null) {
      startIdx = i
    } else if (!intervals[i] && startIdx !== null) {
      result.push({
        start: formatTime(startIdx * INTERVAL),
        end: formatTime(i * INTERVAL)
      })
      startIdx = null
    }
  }

  return result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!date) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const config = await getStoredConfig()
    
    if (!config.booking?.enabled) {
      return NextResponse.json({ error: 'Las reservas no están habilitadas' }, { status: 400 })
    }

    let serviceDuration = 60
    let service = null
    
    if (serviceId) {
      service = config.services.find(s => s.id === serviceId)
      if (service) {
        serviceDuration = service.durationMinutes || 60
      }
    }
    
    const bedsCapacity = config.booking.bedsCapacity || 1

    const dateObj = new Date(date + 'T12:00:00')
    const dayOfWeek = dateObj.getDay()

    const recurring = config.booking.recurring?.find(r => r.dayOfWeek === dayOfWeek)
    if (!recurring || recurring.slots.length === 0) {
      return NextResponse.json({ slots: [], message: 'No hay atención este día' })
    }

    const exception = config.booking.exceptions?.find(e => e.date === date)
    
    let daySlots: TimeSlot[] = []
    
    if (exception) {
      if (exception.isBlocked) {
        return NextResponse.json({ slots: [], message: 'Esta fecha está bloqueada' })
      }
      
      daySlots = subtractBlockedSlots(recurring.slots, exception.slots)
    } else {
      daySlots = recurring.slots
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(date + 'T00:00:00')
    if (selectedDate < today) {
      return NextResponse.json({ slots: [], message: 'No se pueden reservar fechas pasadas' })
    }

    const existingReservations = await getReservationsByDate(date)
    const scheduledClasses = await getScheduledClassesByDate(date)
    const orders = await getOrders()
    
    const getOccupancyAtTime = (time: string): number => {
      let count = 0
      
      count += existingReservations.filter(r => r.time === time && r.status === 'confirmed').length
      count += scheduledClasses.filter(c => c.time === time && c.status === 'scheduled').length
      count += orders.flatMap(o => 
        o.selectedSlots.filter(s => 
          s.date === date && 
          s.time === time && 
          s.status !== 'absent' && 
          s.status !== 'completed'
        )
      ).length
      
      return count
    }

    const availableSlots: string[] = []
    const spotsLeft: Record<string, number> = {}

    for (const slot of daySlots) {
      const slotStart = parseTime(slot.start)
      const slotEnd = parseTime(slot.end)

      let currentTime = slotStart
      while (currentTime + serviceDuration <= slotEnd) {
        const timeStr = formatTime(currentTime)
        const occupancy = getOccupancyAtTime(timeStr)
        const remaining = bedsCapacity - occupancy
        
        if (remaining > 0) {
          if (selectedDate.toDateString() === today.toDateString()) {
            const now = new Date()
            const currentMinutes = now.getHours() * 60 + now.getMinutes()
            if (currentTime > currentMinutes + 60) {
              availableSlots.push(timeStr)
              spotsLeft[timeStr] = remaining
            }
          } else {
            availableSlots.push(timeStr)
            spotsLeft[timeStr] = remaining
          }
        }

        currentTime += 30
      }
    }

    return NextResponse.json({ 
      slots: availableSlots,
      spotsLeft,
      bedsCapacity,
      ...(service && {
        service: {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: serviceDuration
        }
      })
    })
  } catch (error) {
    console.error('Error getting slots:', error)
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 })
  }
}
