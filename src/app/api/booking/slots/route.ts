import { NextRequest, NextResponse } from 'next/server'
import { getStoredConfig, getReservationsByDate } from '@/lib/storage'
import { parseTime, formatTime } from '@/data/config'
import type { TimeSlot } from '@/data/config'

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

    if (!date || !serviceId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const config = await getStoredConfig()
    
    if (!config.booking?.enabled) {
      return NextResponse.json({ error: 'Las reservas no están habilitadas' }, { status: 400 })
    }

    const service = config.services.find(s => s.id === serviceId)
    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 400 })
    }

    const serviceDuration = service.durationMinutes || 60

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
    const reservedRanges = existingReservations.map(r => ({
      start: parseTime(r.time),
      end: parseTime(r.endTime || r.time) || parseTime(r.time) + 60
    }))

    const availableSlots: string[] = []

    for (const slot of daySlots) {
      const slotStart = parseTime(slot.start)
      const slotEnd = parseTime(slot.end)

      let currentTime = slotStart
      while (currentTime + serviceDuration <= slotEnd) {
        const slotEndTime = currentTime + serviceDuration
        
        const isReserved = reservedRanges.some(reserved => 
          (currentTime >= reserved.start && currentTime < reserved.end) ||
          (slotEndTime > reserved.start && slotEndTime <= reserved.end) ||
          (currentTime <= reserved.start && slotEndTime >= reserved.end)
        )

        if (!isReserved) {
          if (selectedDate.toDateString() === today.toDateString()) {
            const now = new Date()
            const currentMinutes = now.getHours() * 60 + now.getMinutes()
            if (currentTime > currentMinutes + 60) {
              availableSlots.push(formatTime(currentTime))
            }
          } else {
            availableSlots.push(formatTime(currentTime))
          }
        }

        currentTime += 30
      }
    }

    return NextResponse.json({ 
      slots: availableSlots,
      service: {
        id: service.id,
        name: service.name,
        price: service.price,
        duration: serviceDuration
      }
    })
  } catch (error) {
    console.error('Error getting slots:', error)
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 })
  }
}
