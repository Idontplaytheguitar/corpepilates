'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Check, Loader2, CreditCard, ShoppingBag, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { formatPrice } from '@/data/config'
import type { SiteConfig, RecurringSchedule, DateException } from '@/data/config'
import { useCart } from '@/context/CartContext'

interface CheckoutItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
}

interface CheckoutServiceItem extends CheckoutItem {
  durationMinutes: number
}

interface CheckoutData {
  items: CheckoutItem[]
  serviceItems: CheckoutServiceItem[]
  customer: {
    name: string
    email: string
    phone: string
    age?: string
    healthConditions?: string
  }
}

interface SelectedSlot {
  serviceId: string
  serviceIndex: number
  date: string
  time: string
  durationMinutes: number
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function CheckoutTurnosPage() {
  const router = useRouter()
  const { clearCart } = useCart()
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [recurring, setRecurring] = useState<RecurringSchedule[]>([])
  const [exceptions, setExceptions] = useState<DateException[]>([])
  
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0)
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0)
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('checkoutData')
    if (!stored) {
      router.push('/')
      return
    }
    
    try {
      const data = JSON.parse(stored) as CheckoutData
      if (!data.serviceItems || data.serviceItems.length === 0) {
        router.push('/')
        return
      }
      setCheckoutData(data)
    } catch {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        setSiteConfig(data.site)
        setRecurring(data.booking?.recurring || [])
        setExceptions(data.booking?.exceptions || [])
      })
  }, [])

  useEffect(() => {
    if (selectedDate && checkoutData) {
      setLoadingSlots(true)
      const currentService = getCurrentService()
      if (!currentService) return
      
      const alreadySelectedOnDate = selectedSlots
        .filter(s => s.date === selectedDate)
        .map(s => ({ time: s.time, duration: s.durationMinutes }))

      fetch(`/api/booking/slots?date=${selectedDate}&serviceId=${currentService.id}`)
        .then(res => res.json())
        .then(data => {
          let slots = data.slots || []
          
          slots = slots.filter((slot: string) => {
            const slotStart = timeToMinutes(slot)
            const slotEnd = slotStart + currentService.durationMinutes
            
            return !alreadySelectedOnDate.some(selected => {
              const selectedStart = timeToMinutes(selected.time)
              const selectedEnd = selectedStart + selected.duration
              return (slotStart < selectedEnd && slotEnd > selectedStart)
            })
          })
          
          setAvailableSlots(slots)
          setLoadingSlots(false)
        })
        .catch(() => setLoadingSlots(false))
    }
  }, [selectedDate, checkoutData, selectedSlots, currentServiceIndex, currentSlotIndex])

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const getTotalSlotsNeeded = () => {
    if (!checkoutData) return 0
    return checkoutData.serviceItems.reduce((sum, s) => sum + s.quantity, 0)
  }

  const getCurrentService = (): CheckoutServiceItem | null => {
    if (!checkoutData) return null
    
    let count = 0
    for (const service of checkoutData.serviceItems) {
      for (let i = 0; i < service.quantity; i++) {
        if (count === currentServiceIndex + currentSlotIndex) {
          return service
        }
        count++
      }
    }
    return checkoutData.serviceItems[0] || null
  }

  const getCurrentSlotLabel = (): string => {
    if (!checkoutData) return ''
    
    let count = 0
    for (const service of checkoutData.serviceItems) {
      for (let i = 0; i < service.quantity; i++) {
        if (count === selectedSlots.length) {
          if (service.quantity > 1) {
            return `${service.name} (${i + 1}/${service.quantity})`
          }
          return service.name
        }
        count++
      }
    }
    return ''
  }

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay()
    const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const dateStr = date.toISOString().split('T')[0]
    
    const exception = exceptions.find(e => e.date === dateStr)
    if (exception) {
      if (exception.isBlocked) return false
    }
    
    const hasRecurring = recurring.some(r => r.dayOfWeek === dayIdx && r.slots.length > 0)
    return hasRecurring
  }

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

  const handleSelectSlot = (time: string) => {
    const currentService = getCurrentService()
    if (!currentService || !selectedDate) return
    
    const newSlot: SelectedSlot = {
      serviceId: currentService.id,
      serviceIndex: selectedSlots.filter(s => s.serviceId === currentService.id).length,
      date: selectedDate,
      time,
      durationMinutes: currentService.durationMinutes
    }
    
    setSelectedSlots([...selectedSlots, newSlot])
    setSelectedDate('')
    setAvailableSlots([])
  }

  const removeSlot = (index: number) => {
    setSelectedSlots(selectedSlots.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!checkoutData || selectedSlots.length < getTotalSlotsNeeded()) return
    
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutData.items,
          serviceItems: checkoutData.serviceItems.map(s => ({
            ...s,
            selectedSlots: selectedSlots
              .filter(slot => slot.serviceId === s.id)
              .map(slot => ({ date: slot.date, time: slot.time }))
          })),
          customer: checkoutData.customer,
        }),
      })

      const data = await response.json()

      if (data.init_point) {
        localStorage.setItem('pendingOrder', JSON.stringify({
          items: checkoutData.items,
          serviceItems: checkoutData.serviceItems,
          selectedSlots,
          customer: checkoutData.customer,
          total: getTotal(),
        }))
        clearCart()
        window.location.href = data.init_point
      } else {
        setError('Error al procesar el pago')
      }
    } catch (err) {
      console.error(err)
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const getTotal = () => {
    if (!checkoutData) return 0
    const productTotal = checkoutData.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const serviceTotal = checkoutData.serviceItems.reduce((sum, s) => sum + s.price * s.quantity, 0)
    return productTotal + serviceTotal
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    )
  }

  const totalSlotsNeeded = getTotalSlotsNeeded()
  const allSlotsSelected = selectedSlots.length >= totalSlotsNeeded

  const handleCancel = () => {
    if (confirm('¿Seguro que querés cancelar? Volverás al inicio.')) {
      localStorage.removeItem('checkoutData')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-start justify-between mb-2">
          <h1 className="font-display text-3xl font-semibold text-rose-800">
            Seleccionar Turnos
          </h1>
          <button
            onClick={handleCancel}
            className="text-sm text-nude-500 hover:text-rose-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
        <p className="text-nude-600 mb-6">
          Elegí fecha y hora para cada servicio
        </p>

        {siteConfig?.location && (
          <div className="flex items-center gap-2 text-sage-700 bg-sage-50 px-4 py-2 rounded-lg mb-6 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{siteConfig.location}</span>
          </div>
        )}

        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: totalSlotsNeeded }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < selectedSlots.length ? 'bg-rose-500' : 'bg-cream-200'
              }`}
            />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-cream-100 p-6">
            <h2 className="font-display text-xl font-semibold text-rose-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {allSlotsSelected ? 'Turnos seleccionados' : getCurrentSlotLabel()}
            </h2>

            {!allSlotsSelected ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-rose-600" />
                    </button>
                    <span className="font-semibold text-rose-800">
                      {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-rose-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="py-1 text-nude-500 font-medium">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth().map((date, idx) => {
                      if (!date) return <div key={idx} />
                      
                      const dateStr = date.toISOString().split('T')[0]
                      const isSelected = selectedDate === dateStr
                      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                      const isAvailable = !isPast && isDateAvailable(date)
                      const isToday = new Date().toDateString() === date.toDateString()

                      return (
                        <button
                          key={idx}
                          onClick={() => isAvailable && setSelectedDate(dateStr)}
                          disabled={!isAvailable}
                          className={`py-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-rose-500 text-white shadow-md'
                              : !isAvailable
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

                {selectedDate && (
                  <div>
                    <h3 className="font-medium text-rose-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDateDisplay(selectedDate)}
                    </h3>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-nude-500 text-center py-4">
                        No hay horarios disponibles
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {availableSlots.map(time => (
                          <button
                            key={time}
                            onClick={() => handleSelectSlot(time)}
                            className="px-3 py-2 text-sm rounded-lg border border-cream-200 hover:border-rose-400 hover:bg-rose-50 text-rose-800 transition-all"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                {selectedSlots.map((slot, idx) => {
                  const service = checkoutData.serviceItems.find(s => s.id === slot.serviceId)
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sage-800">{service?.name}</p>
                        <p className="text-sm text-sage-600">
                          {formatDateDisplay(slot.date)} • {slot.time}
                        </p>
                      </div>
                      <button
                        onClick={() => removeSlot(idx)}
                        className="text-rose-500 hover:text-rose-700 text-sm"
                      >
                        Cambiar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-cream-100 p-6">
            <h2 className="font-display text-xl font-semibold text-rose-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Resumen
            </h2>

            <div className="space-y-4">
              {checkoutData.items.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-nude-500 uppercase tracking-wide">Productos</h3>
                  {checkoutData.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-rose-800">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-rose-600 font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {checkoutData.serviceItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-nude-500 uppercase tracking-wide">Servicios</h3>
                  {checkoutData.serviceItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-sage-800">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-sage-600 font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-cream-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-rose-700">Total</span>
                  <span className="text-2xl font-display font-semibold text-rose-800">
                    {formatPrice(getTotal())}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-nude-500 mb-2">Datos del cliente</p>
                <div className="text-sm text-nude-700 space-y-1">
                  <p>{checkoutData.customer.name}</p>
                  <p>{checkoutData.customer.email}</p>
                  <p>{checkoutData.customer.phone}</p>
                  {checkoutData.customer.age && (
                    <p>Edad: {checkoutData.customer.age} anos</p>
                  )}
                  {checkoutData.customer.healthConditions && (
                    <p className="text-xs text-nude-500">
                      Condiciones: {checkoutData.customer.healthConditions}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-rose-500 text-sm text-center">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!allSlotsSelected || submitting}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : allSlotsSelected ? (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pagar con MercadoPago
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Seleccioná {totalSlotsNeeded - selectedSlots.length} turno{totalSlotsNeeded - selectedSlots.length !== 1 ? 's' : ''} más
                  </>
                )}
              </button>

              {!allSlotsSelected && (
                <p className="text-center text-xs text-nude-500">
                  {selectedSlots.length}/{totalSlotsNeeded} turnos seleccionados
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
