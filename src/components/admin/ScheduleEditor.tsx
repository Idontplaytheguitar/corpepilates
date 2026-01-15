'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Calendar, Clock, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { RecurringSchedule, DateException, TimeSlot, Reservation } from '@/data/config'
import { DAYS_OF_WEEK } from '@/data/config'

const CALENDAR_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

interface CustomDatePickerProps {
  value: string
  onChange: (date: string) => void
  minDate?: Date
}

function CustomDatePicker({ value, onChange, minDate }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value + 'T12:00:00') : new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    
    const startPadding = (firstDay.getDay() + 6) % 7
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const isDateDisabled = (date: Date) => {
    if (!minDate) return false
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    return date < min
  }

  const handleSelect = (date: Date) => {
    if (isDateDisabled(date)) return
    const dateStr = date.toISOString().split('T')[0]
    onChange(dateStr)
    setIsOpen(false)
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left
                   ${isOpen ? 'border-rose-500 ring-4 ring-rose-100' : 'border-cream-200 hover:border-rose-300'}
                   bg-white hover:bg-rose-50/50`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
                        ${isOpen ? 'bg-rose-500' : 'bg-rose-100 hover:bg-rose-200'}`}>
          <Calendar className={`w-5 h-5 ${isOpen ? 'text-white' : 'text-rose-500'}`} />
        </div>
        <span className={`font-medium ${value ? 'text-rose-800' : 'text-nude-400'}`}>
          {value ? formatDisplayDate(value) : 'Seleccionar fecha'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-cream-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-rose-600" />
            </button>
            <span className="font-semibold text-rose-800">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-rose-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {CALENDAR_DAYS.map(day => (
              <div key={day} className="py-1 text-nude-500 font-medium">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((date, idx) => {
              if (!date) return <div key={idx} />
              
              const dateStr = date.toISOString().split('T')[0]
              const isSelected = value === dateStr
              const disabled = isDateDisabled(date)
              const isToday = new Date().toDateString() === date.toDateString()

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(date)}
                  disabled={disabled}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-md'
                      : disabled
                      ? 'text-nude-300 cursor-not-allowed'
                      : isToday
                      ? 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                      : 'hover:bg-rose-100 text-rose-800'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface ScheduleEditorProps {
  recurring: RecurringSchedule[]
  exceptions: DateException[]
  reservations?: Reservation[]
  onUpdateRecurring: (recurring: RecurringSchedule[]) => void
  onUpdateExceptions: (exceptions: DateException[]) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const INTERVALS_PER_HOUR = 2
const TOTAL_INTERVALS = 24 * INTERVALS_PER_HOUR

function intervalToTime(interval: number): string {
  const hours = Math.floor(interval / INTERVALS_PER_HOUR)
  const mins = (interval % INTERVALS_PER_HOUR) * 30
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const WORK_HOURS_START = 7
const WORK_HOURS_END = 22

function timeToInterval(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * INTERVALS_PER_HOUR + Math.floor(m / 30)
}

function slotsToIntervals(slots: TimeSlot[]): boolean[] {
  const intervals = new Array(TOTAL_INTERVALS).fill(false)
  slots.forEach(slot => {
    const start = timeToInterval(slot.start)
    const end = timeToInterval(slot.end)
    for (let i = start; i < end && i < TOTAL_INTERVALS; i++) {
      intervals[i] = true
    }
  })
  return intervals
}

function intervalsToSlots(intervals: boolean[]): TimeSlot[] {
  const slots: TimeSlot[] = []
  let start: number | null = null
  
  for (let i = 0; i <= TOTAL_INTERVALS; i++) {
    if (intervals[i] && start === null) {
      start = i
    } else if (!intervals[i] && start !== null) {
      slots.push({
        start: intervalToTime(start),
        end: intervalToTime(i)
      })
      start = null
    }
  }
  
  return slots
}

interface TimeListEditorProps {
  slots: TimeSlot[]
  onChange: (slots: TimeSlot[]) => void
}

function TimeListEditor({ slots, onChange }: TimeListEditorProps) {
  const [intervals, setIntervals] = useState<boolean[]>(() => slotsToIntervals(slots))

  useEffect(() => {
    setIntervals(slotsToIntervals(slots))
  }, [slots])

  const toggleInterval = (index: number) => {
    const next = [...intervals]
    next[index] = !next[index]
    setIntervals(next)
    onChange(intervalsToSlots(next))
  }

  const toggleHour = (hour: number) => {
    const idx1 = hour * INTERVALS_PER_HOUR
    const idx2 = idx1 + 1
    const bothActive = intervals[idx1] && intervals[idx2]
    const next = [...intervals]
    next[idx1] = !bothActive
    next[idx2] = !bothActive
    setIntervals(next)
    onChange(intervalsToSlots(next))
  }

  const selectRange = (startHour: number, endHour: number) => {
    const next = [...intervals]
    for (let h = startHour; h < endHour; h++) {
      next[h * INTERVALS_PER_HOUR] = true
      next[h * INTERVALS_PER_HOUR + 1] = true
    }
    setIntervals(next)
    onChange(intervalsToSlots(next))
  }

  const clearAll = () => {
    const next = new Array(TOTAL_INTERVALS).fill(false)
    setIntervals(next)
    onChange([])
  }

  const selectAll = () => {
    const next = [...intervals]
    for (let h = WORK_HOURS_START; h < WORK_HOURS_END; h++) {
      next[h * INTERVALS_PER_HOUR] = true
      next[h * INTERVALS_PER_HOUR + 1] = true
    }
    setIntervals(next)
    onChange(intervalsToSlots(next))
  }

  const workHours = HOURS.filter(h => h >= WORK_HOURS_START && h < WORK_HOURS_END)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => selectRange(8, 12)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cream-100 text-nude-600 hover:bg-cream-200 transition-colors"
        >
          Mañana (08-12)
        </button>
        <button
          onClick={() => selectRange(14, 18)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cream-100 text-nude-600 hover:bg-cream-200 transition-colors"
        >
          Tarde (14-18)
        </button>
        <button
          onClick={selectAll}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sage-100 text-sage-700 hover:bg-sage-200 transition-colors"
        >
          Todo el día
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Limpiar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
        {workHours.map(hour => {
          const idx1 = hour * INTERVALS_PER_HOUR
          const idx2 = idx1 + 1
          const slot1Active = intervals[idx1]
          const slot2Active = intervals[idx2]
          const bothActive = slot1Active && slot2Active
          const hourLabel = `${hour.toString().padStart(2, '0')}:00`

          return (
            <div
              key={hour}
              className="bg-cream-50 rounded-lg border border-cream-200 p-3 hover:border-rose-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => toggleHour(hour)}
                  className={`text-sm font-semibold transition-colors ${
                    bothActive ? 'text-sage-700' : slot1Active || slot2Active ? 'text-rose-700' : 'text-nude-500'
                  }`}
                >
                  {hourLabel}
                </button>
                <div className={`w-2 h-2 rounded-full ${bothActive ? 'bg-sage-500' : slot1Active || slot2Active ? 'bg-rose-400' : 'bg-cream-300'}`} />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleInterval(idx1)}
                  className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                    slot1Active
                      ? 'bg-sage-400 text-white shadow-sm hover:bg-sage-500'
                      : 'bg-cream-100 text-nude-500 hover:bg-cream-200'
                  }`}
                >
                  {hour.toString().padStart(2, '0')}:00
                </button>
                <button
                  onClick={() => toggleInterval(idx2)}
                  className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                    slot2Active
                      ? 'bg-sage-400 text-white shadow-sm hover:bg-sage-500'
                      : 'bg-cream-100 text-nude-500 hover:bg-cream-200'
                  }`}
                >
                  {hour.toString().padStart(2, '0')}:30
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-nude-400 flex items-center gap-4 pt-2 border-t border-cream-200">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-sage-400 rounded" /> Activo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-cream-200 rounded" /> Inactivo
        </span>
      </div>
    </div>
  )
}

interface BlockingListEditorProps {
  blockedSlots: TimeSlot[]
  recurringSlots: TimeSlot[]
  reservedSlots?: TimeSlot[]
  onChange: (blockedSlots: TimeSlot[]) => void
}

function BlockingListEditor({ blockedSlots, recurringSlots, reservedSlots = [], onChange }: BlockingListEditorProps) {
  const recurringIntervals = slotsToIntervals(recurringSlots)
  const reservedIntervals = slotsToIntervals(reservedSlots)
  const [blockedIntervals, setBlockedIntervals] = useState<boolean[]>(() => slotsToIntervals(blockedSlots))

  useEffect(() => {
    setBlockedIntervals(slotsToIntervals(blockedSlots))
  }, [blockedSlots])

  const toggleInterval = (index: number) => {
    if (!recurringIntervals[index] || reservedIntervals[index]) return
    const next = [...blockedIntervals]
    next[index] = !next[index]
    setBlockedIntervals(next)
    onChange(intervalsToSlots(next))
  }

  const clearAll = () => {
    const next = new Array(TOTAL_INTERVALS).fill(false)
    setBlockedIntervals(next)
    onChange([])
  }

  const activeHours = HOURS.filter(h => {
    const idx1 = h * INTERVALS_PER_HOUR
    const idx2 = idx1 + 1
    return recurringIntervals[idx1] || recurringIntervals[idx2]
  })

  if (activeHours.length === 0) {
    return (
      <div className="text-sm text-nude-400 text-center py-4">
        No hay horarios laborables configurados para este día
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-nude-500 font-medium">
        Tocá los horarios que querés bloquear (se pondrán rojos)
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        {activeHours.map(hour => {
          const idx1 = hour * INTERVALS_PER_HOUR
          const idx2 = idx1 + 1
          const slot1Recurring = recurringIntervals[idx1]
          const slot2Recurring = recurringIntervals[idx2]
          const slot1Reserved = reservedIntervals[idx1]
          const slot2Reserved = reservedIntervals[idx2]
          const slot1Blocked = blockedIntervals[idx1]
          const slot2Blocked = blockedIntervals[idx2]

          return (
            <div key={hour} className="bg-cream-50 rounded-lg border border-cream-200 p-2">
              <div className="text-xs font-semibold text-nude-600 mb-1.5">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex gap-1.5">
                {slot1Recurring && (
                  <button
                    onClick={() => toggleInterval(idx1)}
                    disabled={slot1Reserved}
                    className={`flex-1 py-1.5 px-1 rounded text-[11px] font-medium transition-all ${
                      slot1Reserved
                        ? 'bg-amber-400 text-white cursor-not-allowed'
                        : slot1Blocked
                        ? 'bg-rose-400 text-white hover:bg-rose-500'
                        : 'bg-sage-400 text-white hover:bg-sage-500'
                    }`}
                  >
                    :00
                  </button>
                )}
                {slot2Recurring && (
                  <button
                    onClick={() => toggleInterval(idx2)}
                    disabled={slot2Reserved}
                    className={`flex-1 py-1.5 px-1 rounded text-[11px] font-medium transition-all ${
                      slot2Reserved
                        ? 'bg-amber-400 text-white cursor-not-allowed'
                        : slot2Blocked
                        ? 'bg-rose-400 text-white hover:bg-rose-500'
                        : 'bg-sage-400 text-white hover:bg-sage-500'
                    }`}
                  >
                    :30
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-cream-200">
        <div className="flex gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-sage-400 rounded" /> Trabajando
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-rose-400 rounded" /> Bloqueado
          </span>
          {reservedSlots.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-400 rounded" /> Reservado
            </span>
          )}
        </div>
        {blockedSlots.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Quitar bloqueos
          </button>
        )}
      </div>
    </div>
  )
}

export default function ScheduleEditor({
  recurring,
  exceptions,
  reservations = [],
  onUpdateRecurring,
  onUpdateExceptions
}: ScheduleEditorProps) {
  const [viewMode, setViewMode] = useState<'recurring' | 'exceptions'>('recurring')
  const [newExceptionDate, setNewExceptionDate] = useState('')
  const [selectedDay, setSelectedDay] = useState<number>(1)

  const getDaySchedule = (dayOfWeek: number): TimeSlot[] => {
    const schedule = recurring.find(r => r.dayOfWeek === dayOfWeek)
    return schedule?.slots || []
  }

  const getReservationsForDate = (date: string): TimeSlot[] => {
    const dateReservations = reservations.filter(r => 
      r.date === date && (r.status === 'confirmed' || r.status === 'pending')
    )
    return dateReservations.map(r => ({
      start: r.time,
      end: r.endTime
    }))
  }

  const updateDaySchedule = (dayOfWeek: number, slots: TimeSlot[]) => {
    const existing = recurring.filter(r => r.dayOfWeek !== dayOfWeek)
    if (slots.length > 0) {
      onUpdateRecurring([...existing, { dayOfWeek, slots }])
    } else {
      onUpdateRecurring(existing)
    }
  }

  const copyToWeekdays = () => {
    const sourceSlots = getDaySchedule(selectedDay)
    const newRecurring: RecurringSchedule[] = recurring.filter(r => r.dayOfWeek === 0 || r.dayOfWeek === 6)
    for (let i = 1; i <= 5; i++) {
      if (sourceSlots.length > 0) {
        newRecurring.push({ dayOfWeek: i, slots: [...sourceSlots] })
      }
    }
    onUpdateRecurring(newRecurring)
  }

  const addException = () => {
    if (!newExceptionDate) return
    const existing = exceptions.find(e => e.date === newExceptionDate)
    if (existing) return
    
    onUpdateExceptions([
      ...exceptions,
      { date: newExceptionDate, slots: [], isBlocked: false }
    ])
    setNewExceptionDate('')
  }

  const updateException = (date: string, updates: Partial<DateException>) => {
    onUpdateExceptions(
      exceptions.map(e => e.date === date ? { ...e, ...updates } : e)
    )
  }

  const removeException = (date: string) => {
    onUpdateExceptions(exceptions.filter(e => e.date !== date))
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('recurring')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            viewMode === 'recurring'
              ? 'bg-rose-500 text-white'
              : 'bg-cream-100 text-nude-600 hover:bg-cream-200'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Horarios semanales
        </button>
        <button
          onClick={() => setViewMode('exceptions')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            viewMode === 'exceptions'
              ? 'bg-rose-500 text-white'
              : 'bg-cream-100 text-nude-600 hover:bg-cream-200'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Días especiales ({exceptions.length})
        </button>
      </div>

      {viewMode === 'recurring' && (
        <div className="space-y-4">
          <p className="text-sm text-nude-500">
            Seleccioná un día y arrastrá sobre la grilla para marcar los horarios de atención.
          </p>

          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => {
              const hasSchedule = getDaySchedule(day.id).length > 0
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDay === day.id
                      ? 'bg-rose-500 text-white'
                      : hasSchedule
                      ? 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                      : 'bg-cream-100 text-nude-500 hover:bg-cream-200'
                  }`}
                >
                  {day.short}
                  {hasSchedule && selectedDay !== day.id && (
                    <span className="ml-1 w-2 h-2 bg-sage-500 rounded-full inline-block" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="bg-cream-50 rounded-xl p-4 border border-cream-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-rose-800">
                {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.name}
              </h4>
              <button
                onClick={copyToWeekdays}
                className="text-xs px-3 py-1.5 bg-sage-100 text-sage-700 rounded-lg hover:bg-sage-200 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar a Lun-Vie
              </button>
            </div>

            <TimeListEditor
              slots={getDaySchedule(selectedDay)}
              onChange={slots => updateDaySchedule(selectedDay, slots)}
            />
          </div>

          <div className="text-sm text-nude-500 bg-cream-50 rounded-lg p-3 border border-cream-200">
            💡 <strong>Tip:</strong> Hacé click y arrastrá para seleccionar rangos. Volvé a hacer click en áreas seleccionadas para deseleccionar.
          </div>
        </div>
      )}

      {viewMode === 'exceptions' && (
        <div className="space-y-4">
          <p className="text-sm text-nude-500">
            Agregá días especiales donde el horario sea diferente al habitual (feriados, vacaciones, horarios especiales).
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <CustomDatePicker
              value={newExceptionDate}
              onChange={setNewExceptionDate}
              minDate={new Date()}
            />
            <button
              type="button"
              onClick={addException}
              disabled={!newExceptionDate}
              className="px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold
                         hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200
                         disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          </div>

          <div className="text-sm bg-amber-50 text-amber-800 rounded-lg p-3 border border-amber-200">
            ⚠️ <strong>Importante:</strong> En los días laborables, seleccioná las horas que <strong>NO</strong> vas a trabajar para bloquearlas. El horario recurrente se muestra en verde, y lo que selecciones se bloqueará (rojo).
          </div>

          {exceptions.length === 0 ? (
            <div className="text-center py-8 text-nude-400 bg-cream-50 rounded-xl">
              No hay días especiales configurados
            </div>
          ) : (
            <div className="space-y-3">
              {exceptions.sort((a, b) => a.date.localeCompare(b.date)).map(exception => {
                const dateObj = new Date(exception.date + 'T12:00:00')
                const dayOfWeek = dateObj.getDay()
                const recurringSlots = getDaySchedule(dayOfWeek)
                
                return (
                  <div key={exception.date} className={`rounded-xl border overflow-hidden ${
                    exception.isBlocked ? 'border-rose-200 bg-rose-50' : 'border-cream-200 bg-white'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 border-b border-cream-200">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-medium text-rose-800 capitalize">
                          {dateObj.toLocaleDateString('es-AR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </span>
                        {recurringSlots.length === 0 && !exception.isBlocked && (
                          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded w-fit">
                            Sin horario recurrente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exception.isBlocked}
                            onChange={e => updateException(exception.date, { 
                              isBlocked: e.target.checked,
                              slots: []
                            })}
                            className="rounded border-cream-300 text-rose-500"
                          />
                          <span className="text-rose-600">No laborable</span>
                        </label>
                        <button
                          onClick={() => removeException(exception.date)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg"
                          title="Eliminar excepción"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {!exception.isBlocked && recurringSlots.length > 0 && (
                      <div className="p-3">
                        <BlockingListEditor
                          blockedSlots={exception.slots}
                          recurringSlots={recurringSlots}
                          reservedSlots={getReservationsForDate(exception.date)}
                          onChange={slots => updateException(exception.date, { slots })}
                        />
                      </div>
                    )}
                    
                    {!exception.isBlocked && recurringSlots.length === 0 && (
                      <div className="p-3 text-sm text-nude-500">
                        Este día no tiene horario recurrente configurado. Configurá primero el horario semanal para {DAYS_OF_WEEK.find(d => d.id === dayOfWeek)?.name?.toLowerCase()}.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
