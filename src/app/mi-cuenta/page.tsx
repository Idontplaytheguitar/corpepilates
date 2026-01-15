'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, ArrowRight, Check, X, Loader2, AlertCircle, Package } from 'lucide-react'
import { formatPrice } from '@/data/config'
import type { UserPack, ScheduledClass, RecurringSchedule, DateException } from '@/data/config'
import Link from 'next/link'
import { useUser } from '@/context/UserContext'

interface SlotInfo {
  time: string
  available: boolean
  spotsLeft: number
}

function MiCuentaContent() {
  const searchParams = useSearchParams()
  const packSuccess = searchParams.get('pack_success')
  const packPending = searchParams.get('pack_pending')
  
  const { user, loading: userLoading, login, logout } = useUser()
  
  const [activePacks, setActivePacks] = useState<UserPack[]>([])
  const [historyPacks, setHistoryPacks] = useState<UserPack[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<ScheduledClass[]>([])
  const [historyClasses, setHistoryClasses] = useState<ScheduledClass[]>([])
  const [recurring, setRecurring] = useState<RecurringSchedule[]>([])
  const [exceptions, setExceptions] = useState<DateException[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedPack, setSelectedPack] = useState<UserPack | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [scheduling, setScheduling] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'packs' | 'clases' | 'historial'>('packs')

  useEffect(() => {
    if (!user) return
    
    Promise.all([
      fetch('/api/user/packs').then(res => res.json()),
      fetch('/api/user/classes').then(res => res.json()),
      fetch('/api/admin/config').then(res => res.json())
    ]).then(([packsData, classesData, configData]) => {
      setActivePacks(packsData.active || [])
      setHistoryPacks(packsData.history || [])
      setUpcomingClasses(classesData.upcoming || [])
      setHistoryClasses(classesData.history || [])
      setRecurring(configData.booking?.recurring || [])
      setExceptions(configData.booking?.exceptions || [])
      setLoading(false)
      
      if (packsData.active?.length > 0) {
        setSelectedPack(packsData.active[0])
      }
    }).catch(() => {
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true)
      fetch(`/api/booking/slots?date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          const slots = (data.slots || []).map((time: string) => ({
            time,
            available: true,
            spotsLeft: data.spotsLeft?.[time] || 1
          }))
          setAvailableSlots(slots)
          setLoadingSlots(false)
        })
        .catch(() => setLoadingSlots(false))
    }
  }, [selectedDate])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
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

  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return false
    
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    
    const recurringSchedule = recurring.find(r => r.dayOfWeek === dayOfWeek)
    if (!recurringSchedule || recurringSchedule.slots.length === 0) return false
    
    const exception = exceptions.find(e => e.date === dateStr)
    if (exception && exception.isBlocked) return false
    
    return true
  }

  const handleSchedule = async () => {
    if (!selectedPack || !selectedDate || !selectedTime) return
    
    setScheduling(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/user/classes/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPackId: selectedPack.id,
          date: selectedDate,
          time: selectedTime
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: '¡Clase agendada! Te esperamos.' })
        setSelectedDate('')
        setSelectedTime('')
        
        const packsRes = await fetch('/api/user/packs')
        const packsData = await packsRes.json()
        setActivePacks(packsData.active || [])
        if (packsData.active?.length > 0) {
          const updatedPack = packsData.active.find((p: UserPack) => p.id === selectedPack.id)
          setSelectedPack(updatedPack || packsData.active[0])
        }
        
        const classesRes = await fetch('/api/user/classes')
        const classesData = await classesRes.json()
        setUpcomingClasses(classesData.upcoming || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al agendar' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    }
    
    setScheduling(false)
  }

  const handleCancel = async (classId: string) => {
    setCancelling(classId)
    setMessage(null)
    
    try {
      const res = await fetch('/api/user/classes/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Clase cancelada' })
        
        const packsRes = await fetch('/api/user/packs')
        const packsData = await packsRes.json()
        setActivePacks(packsData.active || [])
        
        const classesRes = await fetch('/api/user/classes')
        const classesData = await classesRes.json()
        setUpcomingClasses(classesData.upcoming || [])
        setHistoryClasses(classesData.history || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al cancelar' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    }
    
    setCancelling(null)
  }

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
            <Calendar className="w-16 h-16 text-rose-300 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-rose-800 mb-2">
              Mi Cuenta
            </h1>
            <p className="text-nude-500 mb-6">
              Iniciá sesión para ver tus packs y agendar clases
            </p>
            <button
              onClick={() => login('/mi-cuenta')}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors"
            >
              Iniciar sesión con Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-rose-800">
              Hola, {user.name?.split(' ')[0]}!
            </h1>
            <p className="text-nude-500 mt-1">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-nude-500 hover:text-rose-600 text-sm"
          >
            Cerrar sesión
          </button>
        </div>

        {(packSuccess || packPending) && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            packSuccess ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
          }`}>
            {packSuccess ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            <p>
              {packSuccess 
                ? '¡Tu pack fue activado! Ya podés agendar tus clases.'
                : 'Tu pago está pendiente. Una vez confirmado, verás tu pack acá.'
              }
            </p>
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p>{message.text}</p>
            <button onClick={() => setMessage(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['packs', 'clases', 'historial'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-nude-600 hover:bg-rose-50'
              }`}
            >
              {tab === 'packs' && `Mis Packs (${activePacks.length})`}
              {tab === 'clases' && `Próximas Clases (${upcomingClasses.length})`}
              {tab === 'historial' && 'Historial'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'packs' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold text-rose-800">Packs Activos</h2>
                  
                  {activePacks.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                      <Package className="w-12 h-12 text-nude-300 mx-auto mb-4" />
                      <p className="text-nude-500 mb-4">No tenés packs activos</p>
                      <Link
                        href="/packs"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 transition-colors"
                      >
                        Ver packs disponibles
                      </Link>
                    </div>
                  ) : (
                    activePacks.map(pack => {
                      const expirationDate = new Date(pack.expiresAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short'
                      })
                      const isSelected = selectedPack?.id === pack.id
                      
                      return (
                        <button
                          key={pack.id}
                          onClick={() => setSelectedPack(pack)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-cream-200 bg-white hover:border-violet-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-rose-800">{pack.packName}</h3>
                              <p className="text-sm text-nude-500">Vence el {expirationDate}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-violet-600">
                                {pack.classesRemaining}
                              </p>
                              <p className="text-xs text-nude-500">clases restantes</p>
                            </div>
                          </div>
                          <div className="mt-3 bg-cream-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-violet-500 h-full transition-all"
                              style={{ width: `${(pack.classesRemaining / (pack.classesRemaining + pack.classesUsed)) * 100}%` }}
                            />
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                {selectedPack && selectedPack.classesRemaining > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h2 className="font-display text-xl font-semibold text-rose-800 mb-4">
                      Agendar Clase
                    </h2>
                    <p className="text-sm text-nude-500 mb-4">
                      Usando: <span className="font-medium text-violet-600">{selectedPack.packName}</span>
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 hover:bg-cream-100 rounded-lg"
                      >
                        <ArrowLeft className="w-5 h-5 text-rose-600" />
                      </button>
                      <span className="font-medium text-rose-800 capitalize">
                        {currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 hover:bg-cream-100 rounded-lg"
                      >
                        <ArrowRight className="w-5 h-5 text-rose-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-sm mb-4">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                        <div key={i} className="py-2 text-nude-500 font-medium">{day}</div>
                      ))}
                      {getDaysInMonth(currentMonth).map((date, idx) => {
                        if (!date) return <div key={idx} />
                        const dateStr = date.toISOString().split('T')[0]
                        const available = isDateAvailable(date)
                        const selected = selectedDate === dateStr

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (available) {
                                setSelectedDate(dateStr)
                                setSelectedTime('')
                              }
                            }}
                            disabled={!available}
                            className={`py-2 rounded-lg text-sm transition-all ${
                              selected
                                ? 'bg-violet-500 text-white font-semibold'
                                : available
                                ? 'hover:bg-violet-100 text-rose-800'
                                : 'text-nude-300 cursor-not-allowed'
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>

                    {selectedDate && (
                      <div className="border-t pt-4">
                        <h3 className="font-medium text-rose-800 mb-3">
                          Horarios para {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        
                        {loadingSlots ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {availableSlots.map(slot => (
                              <button
                                key={slot.time}
                                onClick={() => setSelectedTime(slot.time)}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                  selectedTime === slot.time
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-cream-100 text-rose-700 hover:bg-cream-200'
                                }`}
                              >
                                {slot.time}
                                {slot.spotsLeft <= 2 && (
                                  <span className="block text-xs opacity-75">
                                    {slot.spotsLeft} lugar{slot.spotsLeft > 1 ? 'es' : ''}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-nude-500 py-4">
                            No hay horarios disponibles
                          </p>
                        )}

                        {selectedTime && (
                          <button
                            onClick={handleSchedule}
                            disabled={scheduling}
                            className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {scheduling ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Agendando...
                              </>
                            ) : (
                              <>
                                <Check className="w-5 h-5" />
                                Confirmar Clase
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'clases' && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold text-rose-800">Próximas Clases</h2>
                
                {upcomingClasses.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <Calendar className="w-12 h-12 text-nude-300 mx-auto mb-4" />
                    <p className="text-nude-500">No tenés clases agendadas</p>
                  </div>
                ) : (
                  upcomingClasses.map(cls => (
                    <div 
                      key={cls.id}
                      className="bg-white rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-sage-600" />
                        </div>
                        <div>
                          <p className="font-medium text-rose-800">
                            {new Date(cls.date + 'T12:00:00').toLocaleDateString('es-AR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </p>
                          <p className="text-sm text-nude-500">
                            {cls.time} - {cls.endTime}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancel(cls.id)}
                        disabled={cancelling === cls.id}
                        className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {cancelling === cls.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Cancelar'
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-rose-800 mb-4">Packs Anteriores</h2>
                  {historyPacks.length === 0 ? (
                    <p className="text-nude-500">No hay packs anteriores</p>
                  ) : (
                    <div className="space-y-2">
                      {historyPacks.map(pack => (
                        <div key={pack.id} className="bg-white rounded-xl p-4 opacity-75">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-nude-700">{pack.packName}</p>
                              <p className="text-sm text-nude-500">
                                {pack.status === 'expired' ? 'Expirado' : 'Clases agotadas'}
                              </p>
                            </div>
                            <p className="text-nude-500">
                              {pack.classesUsed} clases usadas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-display text-xl font-semibold text-rose-800 mb-4">Clases Anteriores</h2>
                  {historyClasses.length === 0 ? (
                    <p className="text-nude-500">No hay clases anteriores</p>
                  ) : (
                    <div className="space-y-2">
                      {historyClasses.slice(0, 10).map(cls => (
                        <div key={cls.id} className="bg-white rounded-xl p-4 opacity-75">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-nude-700">
                                {new Date(cls.date + 'T12:00:00').toLocaleDateString('es-AR', {
                                  day: 'numeric',
                                  month: 'short'
                                })} - {cls.time}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              cls.status === 'completed' ? 'bg-green-100 text-green-700' :
                              cls.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              cls.status === 'absent' ? 'bg-amber-100 text-amber-700' :
                              'bg-nude-100 text-nude-700'
                            }`}>
                              {cls.status === 'completed' ? 'Completada' :
                               cls.status === 'cancelled' ? 'Cancelada' :
                               cls.status === 'absent' ? 'Ausente' : cls.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function MiCuentaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    }>
      <MiCuentaContent />
    </Suspense>
  )
}
