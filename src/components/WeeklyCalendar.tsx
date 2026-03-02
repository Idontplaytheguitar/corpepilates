'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RecurringSchedule, DateException, TimeSlot } from '@/data/config'
import { parseTime, formatTime } from '@/data/config'

interface SlotEntry {
  name: string
  paymentStatus?: string
  id: string
  type: 'class' | 'reservation'
}

interface SlotData {
  time: string
  count: number
  entries?: SlotEntry[]
}

interface WeeklyCalendarProps {
  mode: 'user' | 'admin'
  recurring: RecurringSchedule[]
  exceptions: DateException[]
  capacity: number
  userBookedSlots?: Array<{ date: string; time: string }>
  slotData?: Record<string, SlotData[]>
  onSlotClick?: (date: string, time: string) => void
  onEntryClick?: (id: string, type: 'class' | 'reservation') => void
}

function getWeekDates(offset: number): Date[] {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function WeeklyCalendar({
  mode,
  recurring,
  exceptions,
  capacity,
  userBookedSlots = [],
  slotData = {},
  onSlotClick,
  onEntryClick,
}: WeeklyCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const days = getWeekDates(weekOffset)

  const expandRanges = (ranges: TimeSlot[]): string[] => {
    const result: string[] = []
    for (const slot of ranges) {
      let current = parseTime(slot.start)
      const end = parseTime(slot.end)
      while (current < end) {
        result.push(formatTime(current))
        current += 30
      }
    }
    return result
  }

  const getSlotsForDay = (date: Date): string[] => {
    const dateStr = date.toISOString().split('T')[0]
    const exception = exceptions.find(e => e.date === dateStr)
    if (exception) {
      if (exception.isBlocked) return []
      return expandRanges(exception.slots)
    }
    const jsDay = date.getDay()
    const recurringDay = recurring.find(r => r.dayOfWeek === jsDay)
    return expandRanges(recurringDay?.slots || [])
  }

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString()

  const isPast = (d: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d < today
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-cream-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-rose-600" />
        </button>
        <span className="font-medium text-rose-800 text-sm">
          {days[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} —{' '}
          {days[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-cream-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-rose-600" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 min-w-[560px]">
          {days.map((day, i) => (
            <div
              key={i}
              className={`text-center text-xs font-medium py-2 rounded-t-lg ${
                isToday(day) ? 'bg-rose-500 text-white' : isPast(day) ? 'text-nude-400' : 'text-rose-700'
              }`}
            >
              <div>{DAY_NAMES[i]}</div>
              <div className="text-lg font-semibold">{day.getDate()}</div>
            </div>
          ))}

          {days.map((day, i) => {
            const dateStr = day.toISOString().split('T')[0]
            const slots = getSlotsForDay(day)
            return (
              <div key={i} className="min-h-[80px] flex flex-col gap-1 p-1">
                {slots.map(time => {
                  const data = slotData[dateStr]?.find(s => s.time === time)
                  const isFull = data ? data.count >= capacity : false
                  const userBooked = userBookedSlots.some(s => s.date === dateStr && s.time === time)
                  const past = isPast(day)

                  return (
                    <button
                      key={time}
                      disabled={(isFull && !userBooked) || past}
                      onClick={() => {
                        if (past) return
                        if (mode === 'user' && !isFull) onSlotClick?.(dateStr, time)
                        if (mode === 'admin') {
                          setSelectedSlot(
                            selectedSlot?.date === dateStr && selectedSlot?.time === time
                              ? null
                              : { date: dateStr, time }
                          )
                        }
                      }}
                      className={`w-full text-xs py-1.5 px-1 rounded-md font-medium transition-all ${
                        past
                          ? 'bg-cream-100 text-nude-300 cursor-default'
                          : userBooked
                          ? 'bg-blue-500 text-white'
                          : isFull
                          ? 'bg-red-100 text-red-500 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                      }`}
                    >
                      <div>{time}</div>
                      {mode === 'admin' && data && (
                        <div className="text-[10px] opacity-75">{data.count}/{capacity}</div>
                      )}
                    </button>
                  )
                })}
                {slots.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-nude-300 text-xs">—</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-xs text-nude-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Disponible</span>
        {mode === 'user' && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Tu turno</span>}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Lleno</span>
      </div>

      {mode === 'admin' && selectedSlot && (
        <div className="mt-4 p-4 bg-cream-50 rounded-xl border border-cream-200">
          <h4 className="font-medium text-rose-800 mb-3">
            {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('es-AR', {
              weekday: 'long', day: 'numeric', month: 'long'
            })} · {selectedSlot.time}hs
          </h4>
          {(() => {
            const entries = slotData[selectedSlot.date]?.find(s => s.time === selectedSlot.time)?.entries || []
            if (entries.length === 0) return <p className="text-nude-400 text-sm">Sin reservas</p>
            return entries.map(entry => (
              <div
                key={entry.id}
                onClick={() => onEntryClick?.(entry.id, entry.type)}
                className="flex items-center justify-between p-3 bg-white rounded-lg mb-2 cursor-pointer hover:bg-rose-50 transition-colors"
              >
                <span className="font-medium text-rose-800">{entry.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  entry.paymentStatus === 'verified' || entry.paymentStatus === 'paid_online'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {entry.paymentStatus === 'verified' ? '✓ Verificado'
                   : entry.paymentStatus === 'paid_online' ? '✓ Pagado online'
                   : '⏳ Pendiente'}
                </span>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
