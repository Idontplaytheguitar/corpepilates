'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Calendar, Clock, ArrowLeft, ArrowRight, User, Mail, Phone,
  Loader2, CreditCard, MapPin, AlertCircle, CheckCircle, Home, Heart, ScrollText
} from 'lucide-react'
import { formatPrice } from '@/data/config'
import type { ServiceConfig, SiteConfig, RecurringSchedule, DateException } from '@/data/config'
import Link from 'next/link'
import ReglamentoModal from '@/components/ReglamentoModal'
import { useUser } from '@/context/UserContext'

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)\.]/g, '')
  return /^\+?\d{8,15}$/.test(clean)
}

interface AliasConfig {
  alias: string
  cbu: string
  banco: string
  titular: string
}

interface PreviousProfile {
  name: string
  email: string
  phone: string
  direccion: string
  obraSocial: string
}

function ReservarContent() {
  const searchParams = useSearchParams()
  const preSelectedServiceId = searchParams.get('servicio')
  const { user, loading: userLoading, login } = useUser()

  const [services, setServices] = useState<ServiceConfig[]>([])
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [recurring, setRecurring] = useState<RecurringSchedule[]>([])
  const [exceptions, setExceptions] = useState<DateException[]>([])
  const [bookingEnabled, setBookingEnabled] = useState(false)
  const [mercadopagoEnabled, setMercadopagoEnabled] = useState(false)
  const [singleClassEnabled, setSingleClassEnabled] = useState(true)
  const [aliasConfig, setAliasConfig] = useState<AliasConfig | null>(null)
  const [reglamentoText, setReglamentoText] = useState('')

  const [selectedService, setSelectedService] = useState<ServiceConfig | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [showReglamento, setShowReglamento] = useState(false)
  const [reglamentoAccepted, setReglamentoAccepted] = useState(false)

  const [previousProfile, setPreviousProfile] = useState<PreviousProfile | null>(null)
  const [customer, setCustomer] = useState({
    name: '', email: '', phone: '', age: '', healthConditions: '',
    direccion: '', obraSocial: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'alias' | 'efectivo' | null>(null)
  const [bookingId, setBookingId] = useState('')

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        const activeServices = (data.services || []).filter((s: ServiceConfig) => !s.paused)
        setServices(activeServices)
        setSiteConfig(data.site || null)
        setBookingEnabled(data.booking?.enabled || false)
        setMercadopagoEnabled(data.site?.mercadopagoEnabled !== false)
        setSingleClassEnabled(data.site?.singleClassEnabled !== false)
        setRecurring(data.booking?.recurring || [])
        setExceptions(data.booking?.exceptions || [])
        if (data.site?.aliasConfig) setAliasConfig(data.site.aliasConfig)
        if (data.site?.reglamento) setReglamentoText(data.site.reglamento)

        if (preSelectedServiceId) {
          const pre = activeServices.find((s: ServiceConfig) => s.id === preSelectedServiceId)
          if (pre) setSelectedService(pre)
        }

        // Auto-show reglamento on every page load (required before booking)
        if (data.booking?.enabled !== false) {
          setShowReglamento(true)
        }
      })

    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setPreviousProfile({
            name: '',
            email: '',
            phone: data.profile.telefono || '',
            direccion: data.profile.direccion || '',
            obraSocial: data.profile.obraSocial || '',
          })
        }
      })
      .catch(() => {})
  }, [preSelectedServiceId])

  useEffect(() => {
    if (selectedService && selectedDate) {
      setLoadingSlots(true)
      setAvailableSlots([])
      fetch(`/api/booking/slots?date=${selectedDate}&serviceId=${selectedService.id}`)
        .then(res => res.json())
        .then(data => { setAvailableSlots(data.slots || []); setLoadingSlots(false) })
        .catch(() => setLoadingSlots(false))
    }
  }, [selectedService, selectedDate])

  const handleServiceClick = (service: ServiceConfig) => {
    setSelectedService(service)
    if (!reglamentoAccepted) {
      setShowReglamento(true)
    } else {
      setStep(2)
    }
  }

  const isFormValid = () =>
    !!customer.name && !!customer.email && !!customer.phone && !!customer.age &&
    !!customer.direccion && !!customer.obraSocial &&
    validateEmail(customer.email) && validatePhone(customer.phone)

  const handleSubmit = async (method: 'mercadopago' | 'alias' | 'efectivo') => {
    if (!selectedService || !selectedDate || !selectedTime) return
    if (!isFormValid()) { setError('Completa todos los campos obligatorios'); return }
    if (parseInt(customer.age) <= 0 || parseInt(customer.age) > 120) { setError('Ingresá una edad válida'); return }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          customer,
          paymentMethod: method,
        })
      })
      const data = await res.json()

      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direccion: customer.direccion, obraSocial: customer.obraSocial, telefono: customer.phone })
      }).catch(() => {})

      if (method === 'mercadopago' && data.init_point) {
        window.location.href = data.init_point
      } else if (data.id || data.success) {
        setBookingId(data.id || '')
        setPaymentMethod(method)
        setStep(4)
      } else {
        setError(data.error || 'Error al crear la reserva')
      }
    } catch {
      setError('Error de conexión')
    }
    setSubmitting(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    const startPadding = (firstDay.getDay() + 6) % 7
    for (let i = 0; i < startPadding; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (date < today) return false
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    const recurringSchedule = recurring.find(r => r.dayOfWeek === dayOfWeek)
    if (!recurringSchedule || recurringSchedule.slots.length === 0) return false
    const exception = exceptions.find(e => e.date === dateStr)
    if (exception?.isBlocked) return false
    return true
  }

  const formatDateDisplay = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long'
    })

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-rose-800 mb-2">Iniciá sesión para reservar</h1>
            <p className="text-nude-500 mb-6">Necesitás una cuenta para poder agendar tu clase.</p>
            <button
              onClick={() => login('/reservar')}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Iniciar sesión con Google
            </button>
            <div className="mt-4">
              <Link href="/" className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600">
                <ArrowLeft className="w-4 h-4" />Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!bookingEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Calendar className="w-16 h-16 text-nude-300 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-rose-800 mb-2">Reservas no disponibles</h1>
            <p className="text-nude-500 mb-6">El sistema de reservas online no está habilitado. Contactanos para coordinar tu clase.</p>
            {siteConfig?.whatsapp && (
              <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors mb-4">
                Consultar por WhatsApp
              </a>
            )}
            <div><Link href="/" className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600"><ArrowLeft className="w-4 h-4" />Volver al inicio</Link></div>
          </div>
        </div>
      </div>
    )
  }

  if (!singleClassEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Calendar className="w-16 h-16 text-nude-300 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-rose-800 mb-2">Clases por pack</h1>
            <p className="text-nude-500 mb-6">Para tomar clases necesitás comprar un pack.</p>
            <Link href="/#packs" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-semibold hover:bg-violet-600 transition-colors">
              Ver Packs disponibles
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showReglamento && (
        <ReglamentoModal
          mode="booking"
          customText={reglamentoText || undefined}
          onAccept={() => {
            setReglamentoAccepted(true)
            setShowReglamento(false)
            if (selectedService) setStep(2)
          }}
          onClose={() => setShowReglamento(false)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/#servicios" className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 mb-4">
              <ArrowLeft className="w-4 h-4" />Volver a servicios
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-rose-800">Reservar Turno</h1>
            <p className="text-nude-500 mt-2">Elegí el servicio, fecha y horario que más te convenga</p>
            {siteConfig?.location && (
              <p className="text-sage-600 mt-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" />{siteConfig.location}
              </p>
            )}
          </div>

          {step < 4 && (
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${step >= s ? 'bg-rose-500' : 'bg-cream-200'}`} />
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Step 1: Service selection */}
            {step === 1 && (
              <div className="p-6">
                <h2 className="font-display text-xl font-semibold text-rose-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 text-sm font-bold">1</span>
                  Elegí un servicio
                </h2>

                {/* Reglamento status banner */}
                <div className={`flex items-center justify-between p-4 rounded-xl border mb-6 ${
                  reglamentoAccepted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <ScrollText className={`w-5 h-5 shrink-0 ${reglamentoAccepted ? 'text-green-600' : 'text-rose-500'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${reglamentoAccepted ? 'text-green-800' : 'text-rose-800'}`}>
                        Reglamento del estudio
                      </p>
                      <p className={`text-xs ${reglamentoAccepted ? 'text-green-600' : 'text-rose-600'}`}>
                        {reglamentoAccepted ? 'Ya aceptaste el reglamento' : 'Debés aceptar el reglamento antes de reservar'}
                      </p>
                    </div>
                  </div>
                  {reglamentoAccepted ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <button
                        onClick={() => setShowReglamento(true)}
                        className="text-xs text-green-600 hover:text-green-700 underline underline-offset-2"
                      >
                        Ver
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReglamento(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
                    >
                      <ScrollText className="w-4 h-4" />
                      Leer y aceptar
                    </button>
                  )}
                </div>

                <div className="grid gap-4">
                  {services.map(service => (
                    <button key={service.id} onClick={() => handleServiceClick(service)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        selectedService?.id === service.id ? 'border-rose-500 bg-rose-50' : 'border-cream-200 hover:border-rose-300'
                      }`}>
                      {service.image
                        ? <img src={service.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        : <div className="w-16 h-16 rounded-lg bg-sage-100 flex items-center justify-center text-2xl">💆</div>
                      }
                      <div className="flex-1">
                        <h3 className="font-medium text-rose-800">{service.name}</h3>
                        <p className="text-sm text-nude-500 line-clamp-1">{service.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-rose-600 font-semibold">{formatPrice(service.price)}</span>
                          <span className="text-nude-400 text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />{service.durationMinutes || 60} min
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-rose-400" />
                    </button>
                  ))}
                </div>
                {services.length === 0 && (
                  <div className="text-center py-12 text-nude-400">No hay servicios disponibles en este momento.</div>
                )}
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && selectedService && (
              <div className="p-6">
                <button onClick={() => setStep(1)} className="text-rose-500 hover:text-rose-600 text-sm flex items-center gap-1 mb-4">
                  <ArrowLeft className="w-4 h-4" />Cambiar servicio
                </button>
                <div className="bg-sage-50 rounded-xl p-4 mb-6 flex items-center gap-4">
                  {selectedService.image
                    ? <img src={selectedService.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    : <div className="w-12 h-12 rounded-lg bg-sage-200 flex items-center justify-center">💆</div>
                  }
                  <div>
                    <h3 className="font-medium text-sage-800">{selectedService.name}</h3>
                    <p className="text-sm text-sage-600">{formatPrice(selectedService.price)} · {selectedService.durationMinutes || 60} min</p>
                  </div>
                </div>
                <h2 className="font-display text-xl font-semibold text-rose-800 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 text-sm font-bold">2</span>
                  Elegí fecha y horario
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-cream-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-rose-600" />
                      </button>
                      <span className="font-medium text-rose-800 capitalize">
                        {currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-cream-100 rounded-lg">
                        <ArrowRight className="w-5 h-5 text-rose-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(day => (
                        <div key={day} className="py-2 text-nude-500 font-medium">{day}</div>
                      ))}
                      {getDaysInMonth(currentMonth).map((date, idx) => {
                        if (!date) return <div key={idx} />
                        const dateStr = date.toISOString().split('T')[0]
                        const available = isDateAvailable(date)
                        const selected = selectedDate === dateStr
                        return (
                          <button key={idx} onClick={() => { if (available) { setSelectedDate(dateStr); setSelectedTime('') } }}
                            disabled={!available}
                            className={`py-2 rounded-lg text-sm transition-all ${
                              selected ? 'bg-rose-500 text-white font-semibold'
                              : available ? 'hover:bg-rose-100 text-rose-800'
                              : 'text-nude-300 cursor-not-allowed'
                            }`}>
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    {selectedDate ? (
                      <>
                        <h3 className="font-medium text-rose-800 mb-3 capitalize">{formatDateDisplay(selectedDate)}</h3>
                        {loadingSlots ? (
                          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-rose-400 animate-spin" /></div>
                        ) : availableSlots.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {availableSlots.map(slot => (
                              <button key={slot} onClick={() => setSelectedTime(slot)}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                  selectedTime === slot ? 'bg-rose-500 text-white' : 'bg-cream-100 text-rose-700 hover:bg-cream-200'
                                }`}>
                                {slot}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-nude-400">No hay horarios disponibles para esta fecha</div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-nude-400">
                        <div className="text-center">
                          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Seleccioná una fecha</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {selectedDate && selectedTime && (
                  <button onClick={() => setStep(3)}
                    className="w-full mt-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                    Continuar<ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Customer data + payment */}
            {step === 3 && selectedService && (
              <div className="p-6">
                <button onClick={() => setStep(2)} className="text-rose-500 hover:text-rose-600 text-sm flex items-center gap-1 mb-4">
                  <ArrowLeft className="w-4 h-4" />Cambiar fecha/horario
                </button>
                <div className="bg-sage-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-4 mb-3">
                    {selectedService.image
                      ? <img src={selectedService.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      : <div className="w-12 h-12 rounded-lg bg-sage-200 flex items-center justify-center">💆</div>
                    }
                    <div>
                      <h3 className="font-medium text-sage-800">{selectedService.name}</h3>
                      <p className="text-sm text-sage-600">{selectedService.durationMinutes || 60} minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-sage-700">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDateDisplay(selectedDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedTime}hs</span>
                  </div>
                  {siteConfig?.location && (
                    <div className="flex items-center gap-1 text-sm text-sage-600 mt-2">
                      <MapPin className="w-4 h-4" />{siteConfig.location}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-sage-200 flex justify-between items-center">
                    <span className="text-sage-600">Total</span>
                    <span className="text-xl font-bold text-sage-800">{formatPrice(selectedService.price)}</span>
                  </div>
                </div>

                <h2 className="font-display text-xl font-semibold text-rose-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 text-sm font-bold">3</span>
                  Tus datos
                </h2>

                {previousProfile && (previousProfile.direccion || previousProfile.obraSocial) && (
                  <button type="button"
                    onClick={() => setCustomer(prev => ({ ...prev, ...previousProfile }))}
                    className="w-full mb-4 py-2 px-4 border-2 border-dashed border-rose-300 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-50 transition-colors">
                    ↩ Usar datos anteriores
                  </button>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">
                      <User className="w-4 h-4 inline mr-1" />Nombre completo *
                    </label>
                    <input type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})}
                      placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />Email *
                    </label>
                    <input type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})}
                      placeholder="tu@email.com"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                        customer.email && !validateEmail(customer.email)
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50'
                          : 'border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
                      }`} />
                    {customer.email && !validateEmail(customer.email) && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Email inválido</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />Teléfono / WhatsApp *
                    </label>
                    <input type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})}
                      placeholder="11 1234 5678"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                        customer.phone && !validatePhone(customer.phone)
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50'
                          : 'border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
                      }`} />
                    {customer.phone && !validatePhone(customer.phone) && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Número inválido</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">Edad *</label>
                    <input type="number" min={1} max={120} value={customer.age} onChange={e => setCustomer({...customer, age: e.target.value})}
                      placeholder="Tu edad" className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">
                      <Home className="w-4 h-4 inline mr-1" />Dirección *
                    </label>
                    <input type="text" value={customer.direccion} onChange={e => setCustomer({...customer, direccion: e.target.value})}
                      placeholder="Ej: Av. Corrientes 1234, CABA"
                      className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">
                      <Heart className="w-4 h-4 inline mr-1" />Obra social *
                    </label>
                    <input type="text" value={customer.obraSocial} onChange={e => setCustomer({...customer, obraSocial: e.target.value})}
                      placeholder="Ej: OSDE / No tengo"
                      className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">Tenés dolencias, lesiones o patologías?</label>
                    <textarea value={customer.healthConditions} onChange={e => setCustomer({...customer, healthConditions: e.target.value})}
                      placeholder="Ej: No / Tengo dolor lumbar / Operación de rodilla..." rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none resize-none" />
                  </div>
                </div>

                {error && <p className="mt-4 text-rose-500 text-sm text-center">{error}</p>}

                <div className="mt-6 space-y-3">
                  {mercadopagoEnabled && (
                    <button onClick={() => handleSubmit('mercadopago')} disabled={submitting || !isFormValid()}
                      className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                      Pagar con MercadoPago
                    </button>
                  )}
                  {aliasConfig && (
                    <button onClick={() => handleSubmit('alias')} disabled={submitting || !isFormValid()}
                      className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      💳 Reservar y pagar por transferencia
                    </button>
                  )}
                  <button onClick={() => handleSubmit('efectivo')} disabled={submitting || !isFormValid()}
                    className="w-full py-3 border-2 border-rose-300 text-rose-700 rounded-xl font-medium hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    💵 Reservar y pagar al llegar (efectivo o transferencia)
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && selectedService && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-rose-800 mb-2">
                  {paymentMethod === 'efectivo' ? '¡Reserva creada!' : '¡Reserva creada! Enviá el comprobante'}
                </h2>
                <p className="text-nude-500 mb-6">
                  {paymentMethod === 'efectivo'
                    ? 'Tu clase está agendada. El pago se abona en el estudio.'
                    : 'Tu clase está agendada. Transferí y enviá el comprobante para confirmar.'}
                </p>

                <div className="bg-cream-50 rounded-xl p-4 mb-6 text-left border border-cream-200">
                  <p className="text-sm text-nude-500 mb-1">Tu reserva</p>
                  <p className="font-medium text-rose-800">{selectedService.name}</p>
                  <p className="text-sm text-nude-600">
                    {formatDateDisplay(selectedDate)} · {selectedTime}hs
                  </p>
                </div>

                {paymentMethod === 'alias' && aliasConfig && (
                  <div className="bg-rose-50 rounded-xl p-5 mb-6 text-left border border-rose-200">
                    <h3 className="font-medium text-rose-800 mb-3">Datos de transferencia</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-nude-500">Alias</span><span className="font-mono font-medium text-rose-800">{aliasConfig.alias}</span></div>
                      <div className="flex justify-between"><span className="text-nude-500">CBU/CVU</span><span className="font-mono font-medium text-rose-800 text-xs">{aliasConfig.cbu}</span></div>
                      <div className="flex justify-between"><span className="text-nude-500">Banco</span><span className="font-medium text-rose-800">{aliasConfig.banco}</span></div>
                      <div className="flex justify-between"><span className="text-nude-500">Titular</span><span className="font-medium text-rose-800">{aliasConfig.titular}</span></div>
                      <div className="pt-2 border-t border-rose-200 flex justify-between font-semibold">
                        <span>Total</span><span className="text-rose-700">{formatPrice(selectedService.price)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'alias' && siteConfig?.whatsapp && (
                  <a href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                      `Hola! Hice una reserva para el ${selectedDate} a las ${selectedTime}hs (${selectedService.name}). Te envío el comprobante de transferencia.`
                    )}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full mb-3 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                    📲 Enviar comprobante por WhatsApp
                  </a>
                )}

                <Link href="/mi-cuenta"
                  className="w-full block py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors text-center">
                  Ver mis reservas
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function ReservarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    }>
      <ReservarContent />
    </Suspense>
  )
}
