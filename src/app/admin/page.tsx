'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Plus, Trash2, Eye, EyeOff, Lock, Check, AlertCircle, Loader2, Image as ImageIcon, Key, Mail, Pause, Play, Calendar, Clock, X, LogOut, ChevronDown, ChevronRight } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'
import type { FullConfig, ProductConfig, ServiceConfig, SiteConfig, BookingConfig, RecurringSchedule, DateException, Reservation, PackConfig, ScheduledClass, HeroContent, AboutContent, AboutFeature, FooterContent } from '@/data/config'
import { defaultConfig, formatPrice } from '@/data/config'
import { DEFAULT_REGLAMENTO } from '@/data/reglamento'
import ScheduleEditor from '@/components/admin/ScheduleEditor'
import WeeklyCalendar from '@/components/WeeklyCalendar'


function PaymentRow({ p, onVerified }: { p: any; onVerified: (id: string) => void }) {
  const [confirmingReservation, setConfirmingReservation] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [error, setError] = useState('')
  const needsConfirm = p.type === 'reservation'
  const [reservationConfirmed, setReservationConfirmed] = useState(p.confirmed || !needsConfirm)
  const [paymentVerified, setPaymentVerified] = useState(false)

  const doAction = async (action: 'confirm' | 'verify_payment') => {
    const setLoading = action === 'confirm' ? setConfirmingReservation : setConfirmingPayment
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, type: p.type, action }),
      })
      if (res.ok) {
        if (action === 'confirm') {
          setReservationConfirmed(true)
        } else {
          setPaymentVerified(true)
          setTimeout(() => onVerified(p.id), 800)
        }
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Error ${res.status}`)
      }
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-cream-200 rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-rose-800">{p.name}</p>
        <p className="text-sm text-nude-500 truncate">
          {new Date(p.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {p.time}hs · {p.service}
        </p>
        <p className="text-xs text-nude-400 mt-1">
          {p.method === 'alias' ? '💳 Transferencia' : p.method === 'efectivo' ? '💵 Efectivo' : '—'}
          {p.price > 0 && ` · $${p.price.toLocaleString('es-AR')}`}
        </p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        {/* Confirm reservation — for reservations only */}
        {needsConfirm && (
          reservationConfirmed
            ? <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">✓ Reserva confirmada</span>
            : <button
                onClick={() => doAction('confirm')}
                disabled={confirmingReservation}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60 flex items-center gap-1 transition-colors"
              >
                {confirmingReservation ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'} Confirmar reserva
              </button>
        )}
        {/* Verify payment */}
        {(
          paymentVerified
            ? <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700">✓ Pago verificado</span>
            : <button
                onClick={() => doAction('verify_payment')}
                disabled={confirmingPayment}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white disabled:opacity-60 flex items-center gap-1 transition-colors"
              >
                {confirmingPayment ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'} Verificar pago
              </button>
        )}
      </div>
    </div>
  )
}

function PackPurchaseRow({ p, onAction }: { p: any; onAction: (id: string) => void }) {
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [done, setDone] = useState<'verified' | 'rejected' | null>(null)

  const handleAction = async (action: 'verify' | 'reject') => {
    setActing(true)
    setActionError('')
    try {
      const res = await fetch('/api/admin/pack-purchases/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: p.id, action }),
      })
      if (res.ok) {
        setDone(action === 'verify' ? 'verified' : 'rejected')
        setTimeout(() => onAction(p.id), 800)
      } else {
        const data = await res.json().catch(() => ({}))
        setActionError(data.error || `Error ${res.status}`)
      }
    } catch {
      setActionError('Error de red')
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="bg-white border border-cream-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-rose-800">{p.name}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">Pack</span>
        </div>
        <p className="text-sm text-nude-500 mt-0.5">{p.email}</p>
        <p className="text-sm text-nude-600 mt-1">
          {p.packName} · {p.classCount} clases · ${p.price?.toLocaleString('es-AR')}
        </p>
        <p className="text-xs text-nude-400 mt-1">
          {p.method === 'alias' ? '💳 Transferencia' : p.method === 'efectivo' ? '💵 Efectivo en clase' : '—'}
          {' · '}{new Date(p.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
        {actionError && <p className="text-xs text-red-500 mt-1">{actionError}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        {done === 'verified' ? (
          <span className="px-3 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700">✓ Verificado</span>
        ) : done === 'rejected' ? (
          <span className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700">✕ Rechazado</span>
        ) : (
          <>
            <button
              onClick={() => handleAction('verify')}
              disabled={acting}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-green-500 hover:bg-green-600 text-white disabled:opacity-60 flex items-center gap-1 transition-colors"
            >
              {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓'} Verificar
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={acting}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 transition-colors"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [storedPassword, setStoredPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [site, setSite] = useState<SiteConfig>(defaultConfig.site)
  const [products, setProducts] = useState<ProductConfig[]>(defaultConfig.products)
  const [services, setServices] = useState<ServiceConfig[]>(defaultConfig.services)
  const [packs, setPacks] = useState<PackConfig[]>(defaultConfig.packs || [])
  const [booking, setBooking] = useState<BookingConfig>(defaultConfig.booking!)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([])
  const [orders, setOrders] = useState<{ id: string; items: { name: string; quantity: number; price: number }[]; serviceItems: { name: string; quantity: number; price: number }[]; selectedSlots: { serviceName?: string; date: string; time: string; status?: 'pending' | 'completed' | 'absent' }[]; customer: { name: string; email: string; phone: string }; total: number; status: string; deliveryStatus?: 'pending' | 'delivered'; createdAt: number }[]>([])
  const [activeTab, setActiveTab] = useState<'site' | 'services' | 'packs' | 'booking' | 'pedidos' | 'pagos' | 'calendario' | 'reglamento'>('site')
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [hasChanges, setHasChanges] = useState(false)
  
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [calEntry, setCalEntry] = useState<{ id: string; type: 'class' | 'reservation' } | null>(null)
  const [calEntryVerifying, setCalEntryVerifying] = useState(false)
  const [calEntryError, setCalEntryError] = useState('')
  const [calAction, setCalAction] = useState<'cancel' | 'reschedule' | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([])
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [reglamentoText, setReglamentoText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [heroOpen, setHeroOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [footerOpen, setFooterOpen] = useState(false)

  const closeCalModal = () => {
    setCalEntry(null)
    setCalAction(null)
    setRescheduleDate('')
    setRescheduleTime('')
    setRescheduleSlots([])
  }

  useEffect(() => {
    setCalAction(null)
    setRescheduleDate('')
    setRescheduleTime('')
    setRescheduleSlots([])
  }, [calEntry])

  useEffect(() => {
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true)
        }
        setCheckingSession(false)
      })
      .catch(() => {
        setCheckingSession(false)
      })

    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data.site) setSite(data.site)
        if (data.products) setProducts(data.products)
        if (data.services) setServices(data.services)
        if (data.packs) setPacks(data.packs)
        if (data.booking) setBooking(data.booking)
        setConfigLoaded(true)
      })
      .catch(() => {
        setConfigLoaded(true)
      })
    
    fetch('/api/admin/reservations')
      .then(res => res.json())
      .then(data => setReservations(data.reservations || []))
      .catch(() => {})

    fetch('/api/admin/classes', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setScheduledClasses(data.classes || []))
      .catch(() => {})
    
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .catch(() => {})

    // Fetch pending payments
    fetch('/api/admin/pending-payments', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setPendingPayments(data.payments || [])
        setPendingCount(data.count || 0)
      })
      .catch(() => {})

    // Fetch reglamento
    fetch('/api/admin/reglamento')
      .then(r => r.json())
      .then(data => setReglamentoText(data.reglamento || DEFAULT_REGLAMENTO))
      .catch(() => {})

  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', password }),
    })
    if (res.ok) {
      setIsAuthenticated(true)
      setStoredPassword(password)
      setAuthError('')
    } else {
      setAuthError('Contraseña incorrecta')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    setIsAuthenticated(false)
    setStoredPassword('')
    setPassword('')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')

    try {
      const config: FullConfig = { site, products, services, packs, booking }
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ config }),
      })

      if (res.ok) {
        setSaveStatus('success')
        setHasChanges(false)
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const data = await res.json()
        console.error('Save error:', data.error)
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Save error:', err)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const markChanged = () => setHasChanges(true)

  const addService = () => {
    const newService: ServiceConfig = {
      id: `servicio-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      duration: '60 min',
      durationMinutes: 60,
      image: '',
    }
    setServices([...services, newService])
    markChanged()
  }

  const updateService = (index: number, updates: Partial<ServiceConfig>) => {
    const updated = [...services]
    updated[index] = { ...updated[index], ...updates }
    setServices(updated)
    markChanged()
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
    markChanged()
  }

  const addPack = () => {
    const newPack: PackConfig = {
      id: `pack-${Date.now()}`,
      name: '',
      description: '',
      classCount: 4,
      price: 0,
      validityDays: 30,
      image: '',
    }
    setPacks([...packs, newPack])
    markChanged()
  }

  const updatePack = (index: number, updates: Partial<PackConfig>) => {
    const updated = [...packs]
    updated[index] = { ...updated[index], ...updates }
    setPacks(updated)
    markChanged()
  }

  const removePack = (index: number) => {
    setPacks(packs.filter((_, i) => i !== index))
    markChanged()
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-cream-100 p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-nude-500">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-cream-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-rose-500" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-rose-800">Panel de Admin</h1>
              <p className="text-nude-500 mt-2">Ingresá tu contraseña para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nude-400 hover:text-rose-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch('/api/admin/auth/forgot-password', { method: 'POST' })
                    const data = await res.json()
                    if (data.success) alert(`Link enviado a ${data.email}`)
                    else alert(data.error || 'Error al enviar')
                  }}
                  className="text-xs text-nude-500 hover:text-rose-500 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {authError && (
                <p className="text-rose-500 text-sm text-center">{authError}</p>
              )}
              
              <button
                type="submit"
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors"
              >
                Ingresar
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-rose-600 text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold">Panel de Administración</h1>
              <p className="text-rose-200 mt-1">Configurá tu tienda</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges || !configLoaded}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all ${
                  saveStatus === 'success'
                    ? 'bg-green-500 text-white'
                    : saveStatus === 'error'
                    ? 'bg-red-500 text-white'
                    : hasChanges
                    ? 'bg-white text-rose-600 hover:bg-rose-50'
                    : 'bg-rose-400 text-rose-200 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : saveStatus === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">{saving ? 'Guardando...' : saveStatus === 'success' ? '¡Guardado!' : saveStatus === 'error' ? 'Error' : 'Guardar Cambios'}</span>
                <span className="sm:hidden">{saving ? '...' : saveStatus === 'success' ? '✓' : saveStatus === 'error' ? '!' : 'Guardar'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-3 rounded-xl bg-rose-500 hover:bg-rose-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {hasChanges && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Tenés cambios sin guardar</span>
            </div>
          )}

          <div className="overflow-x-auto shadow-sm mt-2 scrollbar-thin">
            <div className="flex border-b border-cream-200 min-w-max">
              {(['site', 'services', 'packs', 'booking', 'pedidos'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50'
                      : 'text-nude-500 hover:text-rose-500'
                  }`}
                >
                  {tab === 'site' && '⚙️ Negocio'}
                  {tab === 'services' && '💆 Servicios'}
                  {tab === 'packs' && '📦 Packs'}
                  {tab === 'booking' && '📅 Reservas'}
                  {tab === 'pedidos' && '📦 Pedidos'}
                </button>
              ))}
              <button
                onClick={() => setActiveTab('pagos')}
                className={`relative flex-1 py-4 px-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'pagos'
                    ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50'
                    : 'text-nude-500 hover:text-rose-500'
                }`}
              >
                ✓ Verificar
                {pendingCount > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('calendario')}
                className={`flex-1 py-4 px-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'calendario'
                    ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50'
                    : 'text-nude-500 hover:text-rose-500'
                }`}
              >
                📆 Calendario
              </button>
              <button
                onClick={() => setActiveTab('reglamento')}
                className={`flex-1 py-4 px-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'reglamento'
                    ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50'
                    : 'text-nude-500 hover:text-rose-500'
                }`}
              >
                📋 Reglamento
              </button>
            </div>
          </div>

          {(activeTab === 'services' || activeTab === 'packs' || activeTab === 'site') && (
            <button
              onClick={() => { setShowPreview(!showPreview); setPreviewKey(k => k + 1) }}
              className={`fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full shadow-xl font-semibold transition-all text-sm ${
                showPreview ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-white border-2 border-rose-300 text-rose-700'
              }`}
            >
              {showPreview ? '✕ Cerrar vista previa' : '👁 Vista previa'}
            </button>
          )}

          <div>
            <div className="w-full p-6">
            {activeTab === 'site' && (
              <div className="space-y-6 max-w-2xl">
                <h2 className="font-display text-xl font-semibold text-rose-800">Información de tu Negocio</h2>
                
                <FormField
                  label="Nombre de la página"
                  help="El nombre que aparece en el logo y título"
                  value={site.siteName}
                  onChange={v => { setSite({ ...site, siteName: v }); markChanged() }}
                  placeholder="Ej: Corpe Pilates"
                />
                
                <FormField
                  label="Slogan"
                  help="Frase corta debajo del nombre"
                  value={site.tagline}
                  onChange={v => { setSite({ ...site, tagline: v }); markChanged() }}
                  placeholder="Ej: Belleza Natural"
                />
                
                <FormField
                  label="Link de Instagram"
                  help="URL completa de tu perfil de Instagram"
                  value={site.instagram}
                  onChange={v => { setSite({ ...site, instagram: v }); markChanged() }}
                  placeholder="https://instagram.com/tu_usuario"
                  type="url"
                />
                
                <FormField
                  label="Número de WhatsApp"
                  help="Solo números, con código de país (ej: 5491112345678)"
                  value={site.whatsapp}
                  onChange={v => { setSite({ ...site, whatsapp: v }); markChanged() }}
                  placeholder="5491112345678"
                  type="tel"
                />
                
                <FormField
                  label="Email de contacto"
                  help="Email donde te contactan los clientes (también se usa para recuperar contraseña)"
                  value={site.email}
                  onChange={v => { setSite({ ...site, email: v }); markChanged() }}
                  placeholder="hola@ejemplo.com"
                  type="email"
                />

                <div className="border-t border-cream-200 pt-6 mt-6">
                  <h3 className="font-display text-lg font-semibold text-rose-800 mb-4">
                    📍 Ubicación y Entregas
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      label="Ubicación del servicio (opcional)"
                      help="Dirección donde atendés. Dejalo vacío si no querés mostrarlo."
                      value={site.location || ''}
                      onChange={v => { setSite({ ...site, location: v }); markChanged() }}
                      placeholder="Ej: Av. Corrientes 1234, CABA"
                    />
                  </div>
                </div>

                <div className="border-t border-cream-200 pt-6 mt-6">
                  <h3 className="font-display text-lg font-semibold text-rose-800 mb-4">
                    💳 Datos para transferencias
                  </h3>
                  <p className="text-sm text-nude-500 mb-4">
                    Se muestran a los clientes al comprar un pack o reservar una clase con pago por transferencia.
                  </p>
                  <div className="space-y-4">
                    <FormField
                      label="Alias"
                      help="Alias de tu cuenta (ej: corpe.pilates.mp)"
                      value={site.aliasConfig?.alias || ''}
                      onChange={v => { setSite({ ...site, aliasConfig: { alias: v, cbu: site.aliasConfig?.cbu || '', banco: site.aliasConfig?.banco || '', titular: site.aliasConfig?.titular || '' } }); markChanged() }}
                      placeholder="ej: corpe.pilates.mp"
                    />
                    <FormField
                      label="CBU/CVU"
                      help="Número de CBU o CVU de 22 dígitos"
                      value={site.aliasConfig?.cbu || ''}
                      onChange={v => { setSite({ ...site, aliasConfig: { cbu: v, alias: site.aliasConfig?.alias || '', banco: site.aliasConfig?.banco || '', titular: site.aliasConfig?.titular || '' } }); markChanged() }}
                      placeholder="0000003100012345678901"
                    />
                    <FormField
                      label="Banco"
                      help="Nombre del banco o billetera (ej: MercadoPago, Brubank)"
                      value={site.aliasConfig?.banco || ''}
                      onChange={v => { setSite({ ...site, aliasConfig: { banco: v, alias: site.aliasConfig?.alias || '', cbu: site.aliasConfig?.cbu || '', titular: site.aliasConfig?.titular || '' } }); markChanged() }}
                      placeholder="ej: MercadoPago"
                    />
                    <FormField
                      label="Titular"
                      help="Nombre completo del titular de la cuenta"
                      value={site.aliasConfig?.titular || ''}
                      onChange={v => { setSite({ ...site, aliasConfig: { titular: v, alias: site.aliasConfig?.alias || '', cbu: site.aliasConfig?.cbu || '', banco: site.aliasConfig?.banco || '' } }); markChanged() }}
                      placeholder="ej: María García"
                    />
                  </div>
                </div>

                <div className="border-t border-cream-200 pt-6 mt-6">
                  <h3 className="font-display text-lg font-semibold text-rose-800 mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Seguridad
                  </h3>
                  
                  {!showChangePassword ? (
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="px-4 py-2 bg-nude-100 hover:bg-nude-200 text-nude-700 rounded-xl font-medium transition-colors"
                    >
                      Cambiar contraseña del panel
                    </button>
                  ) : (
                    <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-4">
                      {!otpSent ? (
                        <>
                          <p className="text-sm text-nude-600">
                            Te enviaremos un código de verificación al email de contacto configurado.
                          </p>
                          <button
                            onClick={async () => {
                              setPasswordLoading(true)
                              setPasswordError('')
                              try {
                                const res = await fetch('/api/admin/auth', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'request_otp' }),
                                })
                                const data = await res.json()
                                if (data.success) {
                                  setOtpSent(true)
                                  setMaskedEmail(data.email)
                                } else {
                                  setPasswordError(data.error || 'Error al enviar el código')
                                }
                              } catch {
                                setPasswordError('Error de conexión')
                              }
                              setPasswordLoading(false)
                            }}
                            disabled={passwordLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                          >
                            <Mail className="w-4 h-4" />
                            {passwordLoading ? 'Enviando...' : 'Enviar código de verificación'}
                          </button>
                        </>
                      ) : !otpVerified ? (
                        <>
                          <p className="text-sm text-nude-600">
                            Ingresá el código de 6 dígitos enviado a <strong>{maskedEmail}</strong>
                          </p>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 text-center text-2xl tracking-widest font-mono"
                            maxLength={6}
                          />
                          <button
                            onClick={async () => {
                              setPasswordLoading(true)
                              setPasswordError('')
                              try {
                                const res = await fetch('/api/admin/auth', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'verify_otp', otp: otpCode }),
                                })
                                const data = await res.json()
                                if (data.verified) {
                                  setOtpVerified(true)
                                } else {
                                  setPasswordError(data.error || 'Código inválido')
                                }
                              } catch {
                                setPasswordError('Error de conexión')
                              }
                              setPasswordLoading(false)
                            }}
                            disabled={passwordLoading || otpCode.length !== 6}
                            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                          >
                            {passwordLoading ? 'Verificando...' : 'Verificar código'}
                          </button>
                          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <button
                              onClick={async () => {
                                setPasswordLoading(true)
                                setPasswordError('')
                                try {
                                  const res = await fetch('/api/admin/auth', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'request_otp' }),
                                  })
                                  const data = await res.json()
                                  if (data.success) {
                                    setPasswordError('')
                                    setOtpCode('')
                                    alert('Código reenviado a ' + data.email)
                                  } else {
                                    setPasswordError(data.error || 'Error al reenviar')
                                  }
                                } catch {
                                  setPasswordError('Error de conexión')
                                }
                                setPasswordLoading(false)
                              }}
                              disabled={passwordLoading}
                              className="text-sm text-nude-500 hover:text-rose-600 transition-colors"
                            >
                              ¿No llegó? Reenviar código
                            </button>
                            <button
                              onClick={() => {
                                setShowChangePassword(false)
                                setOtpSent(false)
                                setOtpVerified(false)
                                setOtpCode('')
                                setNewPassword('')
                                setConfirmPassword('')
                                setPasswordError('')
                              }}
                              className="text-sm text-nude-500 hover:text-nude-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </>
                      ) : !passwordSuccess ? (
                        <>
                          <p className="text-sm text-sage-600 flex items-center gap-2">
                            <Check className="w-4 h-4" /> Código verificado. Ingresá tu nueva contraseña.
                          </p>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Nueva contraseña (mín. 6 caracteres)"
                              className="w-full px-4 py-3 pr-12 rounded-xl border border-cream-200 focus:border-rose-400"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-nude-400 hover:text-rose-500"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Confirmar contraseña"
                              className="w-full px-4 py-3 pr-12 rounded-xl border border-cream-200 focus:border-rose-400"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-nude-400 hover:text-rose-500"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <button
                            onClick={async () => {
                              if (newPassword !== confirmPassword) {
                                setPasswordError('Las contraseñas no coinciden')
                                return
                              }
                              if (newPassword.length < 6) {
                                setPasswordError('Mínimo 6 caracteres')
                                return
                              }
                              setPasswordLoading(true)
                              setPasswordError('')
                              try {
                                const res = await fetch('/api/admin/auth', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'change_password', otp: otpCode, newPassword }),
                                })
                                const data = await res.json()
                                if (data.success) {
                                  setPasswordSuccess(true)
                                  setStoredPassword(newPassword)
                                } else {
                                  setPasswordError(data.error || 'Error al cambiar la contraseña')
                                }
                              } catch {
                                setPasswordError('Error de conexión')
                              }
                              setPasswordLoading(false)
                            }}
                            disabled={passwordLoading || !newPassword || !confirmPassword}
                            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                          >
                            {passwordLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
                          </button>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Check className="w-6 h-6 text-sage-600" />
                          </div>
                          <p className="text-sage-700 font-medium">¡Contraseña actualizada!</p>
                          <button
                            onClick={() => {
                              setShowChangePassword(false)
                              setOtpSent(false)
                              setOtpVerified(false)
                              setOtpCode('')
                              setNewPassword('')
                              setConfirmPassword('')
                              setPasswordSuccess(false)
                            }}
                            className="mt-3 text-sm text-nude-500 hover:text-nude-700"
                          >
                            Cerrar
                          </button>
                        </div>
                      )}
                      
                      {passwordError && (
                        <p className="text-rose-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {passwordError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Contenido del Hero ── */}
                <div className="border-t border-cream-200 pt-6 mt-6">
                  <button
                    type="button"
                    onClick={() => setHeroOpen(!heroOpen)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="font-display text-lg font-semibold text-rose-800">
                      Contenido del Hero
                    </h3>
                    {heroOpen ? <ChevronDown className="w-5 h-5 text-nude-400" /> : <ChevronRight className="w-5 h-5 text-nude-400" />}
                  </button>
                  {heroOpen && (
                    <div className="mt-4 space-y-4">
                      <FormField
                        label="Eyebrow (texto superior)"
                        help="Texto corto que aparece arriba del nombre"
                        value={site.hero?.eyebrow || defaultConfig.site.hero!.eyebrow}
                        onChange={v => { setSite({ ...site, hero: { ...defaultConfig.site.hero!, ...site.hero, eyebrow: v } }); markChanged() }}
                        placeholder="Ej: Pilates Reformer para todos"
                      />
                      <div>
                        <label className="block text-sm font-medium text-rose-700 mb-1">Descripcion del hero</label>
                        <p className="text-xs text-nude-400 mb-2">El texto principal debajo del nombre</p>
                        <textarea
                          value={site.hero?.description || defaultConfig.site.hero!.description}
                          onChange={e => { setSite({ ...site, hero: { ...defaultConfig.site.hero!, ...site.hero, description: e.target.value } }); markChanged() }}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none resize-none"
                          placeholder="Fortalecé tu core, cuidá tu columna..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="Texto boton primario"
                          value={site.hero?.ctaPrimary || defaultConfig.site.hero!.ctaPrimary}
                          onChange={v => { setSite({ ...site, hero: { ...defaultConfig.site.hero!, ...site.hero, ctaPrimary: v } }); markChanged() }}
                          placeholder="Ver Planes"
                        />
                        <FormField
                          label="Texto boton secundario"
                          value={site.hero?.ctaSecondary || defaultConfig.site.hero!.ctaSecondary}
                          onChange={v => { setSite({ ...site, hero: { ...defaultConfig.site.hero!, ...site.hero, ctaSecondary: v } }); markChanged() }}
                          placeholder="Reservar Clase"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rose-700 mb-1">Feature pills</label>
                        <p className="text-xs text-nude-400 mb-2">Etiquetas que aparecen debajo de los botones</p>
                        <div className="space-y-2">
                          {(site.hero?.featurePills || defaultConfig.site.hero!.featurePills).map((pill, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={pill}
                                onChange={e => {
                                  const pills = [...(site.hero?.featurePills || defaultConfig.site.hero!.featurePills)]
                                  pills[i] = e.target.value
                                  setSite({ ...site, hero: { ...defaultConfig.site.hero!, ...site.hero, featurePills: pills } })
                                  markChanged()
                                }}
                                className="flex-1 px-3 py-2 rounded-lg border border-cream-200 focus:border-rose-400 outline-none text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const pills = [...(site.hero?.featurePills || defaultConfig.site.hero!.featurePills)]
                                  pills.splice(i, 1)
                                  setSite({ ...site, hero: { ...defaultConfig.site.hero!, ...site.hero, featurePills: pills } })
                                  markChanged()
                                }}
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const pills = [...(site.hero?.featurePills || defaultConfig.site.hero!.featurePills), '']
                              setSite({ ...site, hero: { ...defaultConfig.site.hero!, ...site.hero, featurePills: pills } })
                              markChanged()
                            }}
                            className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 font-medium"
                          >
                            <Plus className="w-4 h-4" /> Agregar pill
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Contenido de Sobre Nosotros ── */}
                <div className="border-t border-cream-200 pt-6 mt-6">
                  <button
                    type="button"
                    onClick={() => setAboutOpen(!aboutOpen)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="font-display text-lg font-semibold text-rose-800">
                      Contenido de Sobre Nosotros
                    </h3>
                    {aboutOpen ? <ChevronDown className="w-5 h-5 text-nude-400" /> : <ChevronRight className="w-5 h-5 text-nude-400" />}
                  </button>
                  {aboutOpen && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="Eyebrow"
                          value={site.about?.eyebrow || defaultConfig.site.about!.eyebrow}
                          onChange={v => { setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, eyebrow: v } }); markChanged() }}
                          placeholder="Sobre Nosotros"
                        />
                        <FormField
                          label="Titulo"
                          value={site.about?.heading || defaultConfig.site.about!.heading}
                          onChange={v => { setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, heading: v } }); markChanged() }}
                          placeholder="Pilates Reformer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rose-700 mb-1">Descripcion</label>
                        <p className="text-xs text-nude-400 mb-2">Separa los parrafos con una linea vacia</p>
                        <textarea
                          value={site.about?.description || defaultConfig.site.about!.description}
                          onChange={e => { setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, description: e.target.value } }); markChanged() }}
                          rows={6}
                          className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none resize-none"
                        />
                      </div>

                      {/* Features */}
                      <div>
                        <label className="block text-sm font-medium text-rose-700 mb-2">Tarjetas de features</label>
                        <div className="space-y-3">
                          {(site.about?.features || defaultConfig.site.about!.features).map((feat, i) => (
                            <div key={i} className="p-3 bg-cream-50 rounded-xl border border-cream-200 space-y-2">
                              <div className="flex items-center gap-2">
                                <select
                                  value={feat.icon}
                                  onChange={e => {
                                    const features = [...(site.about?.features || defaultConfig.site.about!.features)]
                                    features[i] = { ...features[i], icon: e.target.value }
                                    setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, features } })
                                    markChanged()
                                  }}
                                  className="px-2 py-1.5 rounded-lg border border-cream-200 text-sm bg-white"
                                >
                                  <option value="Heart">Heart</option>
                                  <option value="Activity">Activity</option>
                                  <option value="Target">Target</option>
                                  <option value="Award">Award</option>
                                </select>
                                <input
                                  type="text"
                                  value={feat.title}
                                  onChange={e => {
                                    const features = [...(site.about?.features || defaultConfig.site.about!.features)]
                                    features[i] = { ...features[i], title: e.target.value }
                                    setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, features } })
                                    markChanged()
                                  }}
                                  placeholder="Titulo"
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-cream-200 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const features = [...(site.about?.features || defaultConfig.site.about!.features)]
                                    features.splice(i, 1)
                                    setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, features } })
                                    markChanged()
                                  }}
                                  className="p-1 text-rose-400 hover:text-rose-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={feat.description}
                                onChange={e => {
                                  const features = [...(site.about?.features || defaultConfig.site.about!.features)]
                                  features[i] = { ...features[i], description: e.target.value }
                                  setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, features } })
                                  markChanged()
                                }}
                                placeholder="Descripcion corta"
                                className="w-full px-3 py-1.5 rounded-lg border border-cream-200 text-sm"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const features = [...(site.about?.features || defaultConfig.site.about!.features), { icon: 'Heart', title: '', description: '' }]
                              setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, features } })
                              markChanged()
                            }}
                            className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 font-medium"
                          >
                            <Plus className="w-4 h-4" /> Agregar feature
                          </button>
                        </div>
                      </div>

                      {/* Gallery images */}
                      <div>
                        <label className="block text-sm font-medium text-rose-700 mb-2">Imagenes de la galeria (4)</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[0, 1, 2, 3].map(i => (
                            <ImageUploader
                              key={i}
                              label={`Imagen ${i + 1}`}
                              value={(site.about?.images || defaultConfig.site.about!.images)[i] || ''}
                              onChange={url => {
                                const images = [...(site.about?.images || defaultConfig.site.about!.images)]
                                images[i] = url
                                setSite({ ...site, about: { ...defaultConfig.site.about!, ...site.about, images } })
                                markChanged()
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Contenido del Footer ── */}
                <div className="border-t border-cream-200 pt-6 mt-6">
                  <button
                    type="button"
                    onClick={() => setFooterOpen(!footerOpen)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="font-display text-lg font-semibold text-rose-800">
                      Contenido del Footer
                    </h3>
                    {footerOpen ? <ChevronDown className="w-5 h-5 text-nude-400" /> : <ChevronRight className="w-5 h-5 text-nude-400" />}
                  </button>
                  {footerOpen && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-rose-700 mb-1">Descripcion del footer</label>
                        <p className="text-xs text-nude-400 mb-2">Texto que aparece debajo del nombre en el pie de pagina (despues del slogan)</p>
                        <textarea
                          value={site.footer?.description || defaultConfig.site.footer!.description}
                          onChange={e => { setSite({ ...site, footer: { description: e.target.value } }); markChanged() }}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none resize-none"
                          placeholder="Transformá tu cuerpo con clases personalizadas de Pilates Reformer."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-rose-800">Tus Planes</h2>
                    <p className="text-nude-500 text-sm mt-1">Planes de clases de Pilates que ofreces</p>
                  </div>
                  <button
                    onClick={addService}
                    disabled={site.singleClassEnabled === false}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-sage-500 text-white rounded-xl hover:bg-sage-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Servicio
                  </button>
                </div>

                <div className="p-4 bg-sage-50 rounded-xl border border-sage-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={site.singleClassEnabled !== false}
                      onChange={e => { setSite({ ...site, singleClassEnabled: e.target.checked }); markChanged() }}
                      className="w-5 h-5 rounded border-sage-300 text-sage-500 focus:ring-sage-400"
                    />
                    <div>
                      <span className="font-medium text-sage-800">Habilitar clases individuales</span>
                      <p className="text-sm text-nude-500">Permite que los usuarios reserven clases sueltas pagando por MercadoPago</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  {services.map((service, index) => (
                    <ServiceEditor
                      key={service.id}
                      service={service}
                      onUpdate={updates => updateService(index, updates)}
                      onRemove={() => removeService(index)}
                    />
                  ))}
                  {services.length === 0 && (
                    <div className="text-center py-12 text-nude-400">
                      No hay servicios. Hacé clic en "Agregar Servicio" para empezar.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'packs' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-rose-800">Packs de Clases</h2>
                    <p className="text-nude-500 text-sm mt-1">Packs de clases que los usuarios pueden comprar y luego agendar</p>
                  </div>
                  <button
                    onClick={addPack}
                    disabled={site.packsEnabled === false}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Pack
                  </button>
                </div>

                <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={site.packsEnabled !== false}
                      onChange={e => { setSite({ ...site, packsEnabled: e.target.checked }); markChanged() }}
                      className="w-5 h-5 rounded border-violet-300 text-violet-500 focus:ring-violet-400"
                    />
                    <div>
                      <span className="font-medium text-violet-800">Habilitar venta de packs</span>
                      <p className="text-sm text-nude-500">Muestra los packs en la web y permite su compra. Tambien habilita el ingreso con Google.</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  {packs.map((pack, index) => (
                    <PackEditor
                      key={pack.id}
                      pack={pack}
                      onUpdate={updates => updatePack(index, updates)}
                      onRemove={() => removePack(index)}
                    />
                  ))}
                  {packs.length === 0 && (
                    <div className="text-center py-12 text-nude-400">
                      No hay packs. Hacé clic en "Agregar Pack" para empezar.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-rose-800">Configuración de Reservas</h2>
                  <p className="text-nude-500 text-sm mt-1">
                    Configurá los días y horarios disponibles para reservar turnos
                  </p>
                </div>

                <div className="p-4 bg-cream-50 rounded-xl border border-cream-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={booking.enabled}
                      onChange={e => { setBooking({ ...booking, enabled: e.target.checked }); markChanged() }}
                      className="w-5 h-5 rounded border-cream-300 text-rose-500 focus:ring-rose-400"
                    />
                    <div>
                      <span className="font-medium text-rose-800">Habilitar sistema de reservas online</span>
                      <p className="text-sm text-nude-500">Los clientes podrán reservar y pagar turnos desde la web</p>
                    </div>
                  </label>
                </div>

                {booking.enabled && (
                  <>
                    <div className="p-4 bg-sage-50 rounded-xl border border-sage-200">
                      <label className="block text-sm font-medium text-sage-700 mb-2">
                        🛏️ Cantidad de camas/reformers
                      </label>
                      <p className="text-xs text-nude-500 mb-3">
                        Cuántas personas pueden reservar el mismo horario simultáneamente
                      </p>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={booking.bedsCapacity || 1}
                          onChange={e => { setBooking({ ...booking, bedsCapacity: parseInt(e.target.value) || 1 }); markChanged() }}
                          className="w-24 px-3 py-2 rounded-lg border border-sage-200 focus:border-sage-400 outline-none text-center text-lg font-semibold"
                        />
                        <span className="text-sm text-sage-600">
                          Cada horario permite hasta {booking.bedsCapacity || 1} reserva{(booking.bedsCapacity || 1) > 1 ? 's' : ''} simultánea{(booking.bedsCapacity || 1) > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <ScheduleEditor
                      recurring={booking.recurring || []}
                      exceptions={booking.exceptions || []}
                      reservations={reservations}
                      onUpdateRecurring={(recurring) => { setBooking({ ...booking, recurring }); markChanged() }}
                      onUpdateExceptions={(exceptions) => { setBooking({ ...booking, exceptions }); markChanged() }}
                    />
                  </>
                )}
              </div>
            )}

            {activeTab === 'pedidos' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-rose-800">Pedidos y Turnos</h2>
                  <p className="text-nude-500 text-sm mt-1">
                    Gestión de entregas, turnos y compras
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-sage-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Turnos agendados ({reservations.filter(r => r.status === 'confirmed').length + orders.flatMap(o => o.selectedSlots.filter(s => s.status !== 'completed' && s.status !== 'absent')).length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {[
                        ...reservations
                          .filter(r => r.status === 'confirmed')
                          .map(r => ({ type: 'reservation' as const, date: r.date, time: r.time, serviceName: r.serviceName, customerName: r.customerName, customerPhone: r.customerPhone, data: r, orderId: '', slotIndex: -1 })),
                        ...orders.flatMap((o) => o.selectedSlots
                          .map((slot, slotIdx) => ({ ...slot, slotIdx, order: o }))
                          .filter(slot => slot.status !== 'completed' && slot.status !== 'absent')
                          .map(slot => ({
                            type: 'order' as const,
                            date: slot.date,
                            time: slot.time,
                            serviceName: slot.serviceName || o.serviceItems[0]?.name || 'Servicio',
                            customerName: o.customer.name,
                            customerPhone: o.customer.phone,
                            data: o,
                            orderId: o.id,
                            slotIndex: slot.slotIdx
                          })))
                      ]
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((item, idx) => (
                          <div
                            key={`${item.type}-${idx}`}
                            className="p-4 bg-sage-50 rounded-xl border border-sage-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-sage-800">{item.serviceName}</p>
                                <p className="text-sm text-sage-600">{item.customerName}</p>
                                <p className="text-xs text-sage-500">{item.customerPhone}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-sage-700">
                                  {new Date(item.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                </p>
                                <p className="text-xs text-sage-500">{item.time}</p>
                              </div>
                            </div>
                            {item.type === 'reservation' ? (
                              <button
                                onClick={() => setSelectedReservation(item.data as Reservation)}
                                className="w-full py-2 bg-sage-200 text-sage-700 rounded-lg text-sm font-medium hover:bg-sage-300 transition-colors"
                              >
                                Ver detalles
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    await fetch('/api/admin/orders', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: item.orderId, slotIndex: item.slotIndex, slotStatus: 'completed' })
                                    })
                                    setOrders(orders.map(o => {
                                      if (o.id === item.orderId) {
                                        const newSlots = [...o.selectedSlots]
                                        newSlots[item.slotIndex] = { ...newSlots[item.slotIndex], status: 'completed' }
                                        return { ...o, selectedSlots: newSlots }
                                      }
                                      return o
                                    }))
                                  }}
                                  className="flex-1 py-2 bg-sage-500 text-white rounded-lg text-sm font-medium hover:bg-sage-600 transition-colors"
                                >
                                  ✓ Cumplido
                                </button>
                                <button
                                  onClick={async () => {
                                    await fetch('/api/admin/orders', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: item.orderId, slotIndex: item.slotIndex, slotStatus: 'absent' })
                                    })
                                    setOrders(orders.map(o => {
                                      if (o.id === item.orderId) {
                                        const newSlots = [...o.selectedSlots]
                                        newSlots[item.slotIndex] = { ...newSlots[item.slotIndex], status: 'absent' }
                                        return { ...o, selectedSlots: newSlots }
                                      }
                                      return o
                                    }))
                                  }}
                                  className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                >
                                  ✗ Ausente
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      {reservations.filter(r => r.status === 'confirmed').length === 0 && orders.flatMap(o => o.selectedSlots.filter(s => s.status !== 'completed' && s.status !== 'absent')).length === 0 && (
                        <p className="text-nude-400 text-sm text-center py-8">No hay turnos pendientes</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-rose-700 mb-3 flex items-center gap-2">
                      🛍️ Historial de compras ({orders.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {orders.map(order => {
                        const allProductsDelivered = order.items.length === 0 || order.deliveryStatus === 'delivered'
                        const allSlotsCompleted = order.selectedSlots.length === 0 || order.selectedSlots.every(s => s.status === 'completed' || s.status === 'absent')
                        const hasAbsent = order.selectedSlots.some(s => s.status === 'absent')
                        return (
                          <button
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`w-full text-left p-4 rounded-xl border transition-colors ${
                              allProductsDelivered && allSlotsCompleted && !hasAbsent
                                ? 'bg-green-50 border-green-200 hover:border-green-300'
                                : hasAbsent
                                  ? 'bg-red-50 border-red-200 hover:border-red-300'
                                  : 'bg-cream-50 border-cream-200 hover:border-rose-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-rose-800">{order.customer.name}</p>
                                <p className="text-sm text-nude-500">
                                  {order.items.length > 0 && `${order.items.length} prod.`}
                                  {order.items.length > 0 && order.selectedSlots.length > 0 && ' + '}
                                  {order.selectedSlots.length > 0 && `${order.selectedSlots.length} turno${order.selectedSlots.length > 1 ? 's' : ''}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-rose-600">{formatPrice(order.total)}</p>
                                <p className="text-xs text-nude-400">
                                  {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                      {orders.length === 0 && (
                        <p className="text-nude-400 text-sm text-center py-8">No hay compras registradas</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedReservation && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReservation(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-display text-2xl font-bold text-rose-800">{selectedReservation.customerName}</h3>
                          <p className="text-sm text-nude-500">{selectedReservation.customerEmail}</p>
                          {selectedReservation.customerPhone && (
                            <p className="text-sm text-nude-500">{selectedReservation.customerPhone}</p>
                          )}
                        </div>
                        <button onClick={() => setSelectedReservation(null)} className="text-nude-400 hover:text-nude-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4 mt-4">
                        <div className="p-4 bg-sage-50 rounded-xl">
                          <p className="font-medium text-sage-800 text-lg">{selectedReservation.serviceName}</p>
                          <p className="text-sage-600">{formatPrice(selectedReservation.servicePrice)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-nude-400 uppercase">Fecha</p>
                            <p className="font-medium text-nude-700">
                              {new Date(selectedReservation.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-nude-400 uppercase">Horario</p>
                            <p className="font-medium text-nude-700">{selectedReservation.time} - {selectedReservation.endTime}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <a
                            href={`https://wa.me/${selectedReservation.customerPhone?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-center text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            WhatsApp
                          </a>
                          <a
                            href={`mailto:${selectedReservation.customerEmail}`}
                            className="flex-1 py-2 bg-rose-100 text-rose-600 rounded-lg text-center text-sm font-medium hover:bg-rose-200 transition-colors"
                          >
                            Email
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-display text-xl font-semibold text-rose-800">Detalle de Compra</h3>
                        <button onClick={() => setSelectedOrder(null)} className="text-nude-400 hover:text-nude-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {selectedOrder.items.length > 0 && (
                          <div>
                            <p className="text-xs text-nude-400 uppercase mb-2">Productos</p>
                            <div className="space-y-2">
                              {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="p-3 bg-cream-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span>{item.name} x{item.quantity}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        selectedOrder.deliveryStatus === 'delivered' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        {selectedOrder.deliveryStatus === 'delivered' ? '✓ Entregado' : '⏳ Pendiente'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedOrder.serviceItems.length > 0 && (
                          <div>
                            <p className="text-xs text-nude-400 uppercase mb-2">Servicios</p>
                            <div className="space-y-2">
                              {selectedOrder.serviceItems.map((item, idx) => {
                                const slot = selectedOrder.selectedSlots[idx]
                                return (
                                  <div key={idx} className="p-3 bg-sage-50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <span>{item.name} x{item.quantity}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                        {slot && (
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            slot.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            slot.status === 'absent' ? 'bg-red-100 text-red-700' :
                                            'bg-sage-200 text-sage-700'
                                          }`}>
                                            {slot.status === 'completed' ? '✓ Cumplido' : slot.status === 'absent' ? '✗ Ausente' : '⏳ Pendiente'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {slot && (
                                      <div className="mt-2 flex items-center gap-2 text-sm text-sage-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(slot.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                        <Clock className="w-4 h-4 ml-1" />
                                        <span>{slot.time}</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center p-4 bg-rose-100 rounded-xl">
                          <span className="font-medium">Total</span>
                          <span className="text-xl font-bold text-rose-700">{formatPrice(selectedOrder.total)}</span>
                        </div>
                        <div className="border-t pt-4">
                          <p className="text-xs text-nude-400 uppercase mb-2">Cliente</p>
                          <p className="font-medium">{selectedOrder.customer.name}</p>
                          <p className="text-sm text-nude-600">{selectedOrder.customer.email}</p>
                          <p className="text-sm text-nude-600">{selectedOrder.customer.phone}</p>
                        </div>
                        <p className="text-xs text-nude-400 text-center">
                          {new Date(selectedOrder.createdAt).toLocaleString('es-AR')}
                        </p>

                        <div className="flex gap-3 pt-2">
                          <a
                            href={`https://wa.me/${selectedOrder.customer.phone?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-center text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            WhatsApp
                          </a>
                          <a
                            href={`mailto:${selectedOrder.customer.email}`}
                            className="flex-1 py-2 bg-rose-100 text-rose-600 rounded-lg text-center text-sm font-medium hover:bg-rose-200 transition-colors"
                          >
                            Email
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pagos' && (
              <div>
                <h2 className="font-display text-xl font-semibold text-rose-800 mb-6">
                  Pagos pendientes ({pendingCount})
                </h2>
                {pendingPayments.length === 0 ? (
                  <div className="text-center py-12 text-nude-400">
                    <div className="text-4xl mb-3">✓</div>
                    <p>No hay pagos pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingPayments.some((p: any) => p.type === 'pack_purchase') && (
                      <div>
                        <h3 className="text-sm font-semibold text-nude-500 uppercase tracking-wide mb-3">Compras de packs</h3>
                        <div className="space-y-3">
                          {pendingPayments.filter((p: any) => p.type === 'pack_purchase').map((p: any) => (
                            <PackPurchaseRow
                              key={p.id}
                              p={p}
                              onAction={(id) => {
                                setPendingPayments(prev => prev.filter((x: any) => x.id !== id))
                                setPendingCount(c => c - 1)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {pendingPayments.some((p: any) => p.type !== 'pack_purchase') && (
                      <div>
                        <h3 className="text-sm font-semibold text-nude-500 uppercase tracking-wide mb-3">Reservas y clases</h3>
                        <div className="space-y-3">
                          {pendingPayments.filter((p: any) => p.type !== 'pack_purchase').map((p: any) => (
                            <PaymentRow
                              key={p.id}
                              p={p}
                              onVerified={(id) => {
                                setPendingPayments(prev => prev.filter((x: any) => x.id !== id))
                                setPendingCount(c => c - 1)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'calendario' && (
              <div>
                <h2 className="font-display text-xl font-semibold text-rose-800 mb-6">Agenda semanal</h2>
                <WeeklyCalendar
                  mode="admin"
                  recurring={booking?.recurring || []}
                  exceptions={booking?.exceptions || []}
                  capacity={booking?.bedsCapacity || 4}
                  onEntryClick={(id, type) => { setCalEntry({ id, type }); setCalEntryError('') }}
                  slotData={(() => {
                    const data: Record<string, { time: string; count: number; entries: { id: string; name: string; status?: string; paymentStatus?: string; type: 'class' | 'reservation' }[] }[]> = {}
                    const add = (date: string, time: string, entry: { id: string; name: string; status?: string; paymentStatus?: string; type: 'class' | 'reservation' }) => {
                      if (!data[date]) data[date] = []
                      let slot = data[date].find(s => s.time === time)
                      if (!slot) { slot = { time, count: 0, entries: [] }; data[date].push(slot) }
                      slot.count++
                      slot.entries.push(entry)
                    }
                    reservations.filter(r => r.status !== 'cancelled').forEach(r =>
                      add(r.date, r.time, { id: r.id, name: r.customerName, status: r.status, paymentStatus: r.paymentStatus || 'pending', type: 'reservation' })
                    )
                    scheduledClasses.filter(c => c.status !== 'cancelled').forEach(c =>
                      add(c.date, c.time, { id: c.id, name: c.customerName, status: c.status, paymentStatus: c.paymentStatus || 'pending', type: 'class' })
                    )
                    return data
                  })()}
                />

                {/* Entry detail / verify modal */}
                {calEntry && (() => {
                  const r = calEntry.type === 'reservation'
                    ? reservations.find(x => x.id === calEntry.id)
                    : null
                  const c = calEntry.type === 'class'
                    ? scheduledClasses.find(x => x.id === calEntry.id)
                    : null
                  const entity = r || c
                  if (!entity) return null
                  const isConfirmed = (entity as any).status === 'confirmed'
                  const isPaid = (entity as any).paymentStatus === 'verified' || (entity as any).paymentStatus === 'paid_online'

                  const doAction = async (action: 'confirm' | 'verify_payment') => {
                    setCalEntryVerifying(true)
                    setCalEntryError('')
                    try {
                      const res = await fetch('/api/admin/verify-payment', {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: calEntry.id, type: calEntry.type, action }),
                      })
                      if (res.ok) {
                        if (calEntry.type === 'reservation') {
                          setReservations(prev => prev.map(x => x.id === calEntry.id
                            ? { ...x, ...(action === 'confirm' ? { status: 'confirmed' } : { paymentStatus: 'verified' }) }
                            : x
                          ))
                        } else {
                          setScheduledClasses(prev => prev.map(x => x.id === calEntry.id
                            ? { ...x, paymentStatus: 'verified' }
                            : x
                          ))
                        }
                      } else {
                        const d = await res.json().catch(() => ({}))
                        setCalEntryError(d.error || 'Error al actualizar')
                      }
                    } catch { setCalEntryError('Error de red') }
                    finally { setCalEntryVerifying(false) }
                  }

                  return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closeCalModal}>
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-display text-lg font-semibold text-rose-800">Detalle de reserva</h3>
                          <button onClick={closeCalModal} className="p-1 rounded-lg hover:bg-cream-100 text-nude-400">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <p><span className="text-nude-400">Nombre:</span> <span className="font-medium text-rose-800">{(entity as any).customerName}</span></p>
                          <p><span className="text-nude-400">Email:</span> <span className="text-nude-600">{(entity as any).customerEmail}</span></p>
                          {(entity as any).customerPhone && <p><span className="text-nude-400">Teléfono:</span> <span className="text-nude-600">{(entity as any).customerPhone}</span></p>}
                          <p><span className="text-nude-400">Fecha:</span> <span className="font-medium text-rose-800">
                            {new Date((entity as any).date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {(entity as any).time}hs
                          </span></p>
                          {r && <p><span className="text-nude-400">Servicio:</span> <span className="text-nude-600">{r.serviceName}</span></p>}
                          {r && <p><span className="text-nude-400">Método:</span> <span className="text-nude-600">{r.paymentMethod === 'alias' ? '💳 Transferencia' : r.paymentMethod === 'efectivo' ? '💵 Efectivo' : '—'}</span></p>}
                        </div>

                        <div className="space-y-3 mb-4">
                          {/* Reservation status — only for reservations */}
                          {r && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200">
                              <div>
                                <p className="text-xs text-nude-400 mb-0.5">Confirmación</p>
                                {isConfirmed
                                  ? <span className="text-sm font-medium text-blue-700">✓ Confirmada</span>
                                  : <span className="text-sm font-medium text-red-600">⏳ Sin confirmar</span>
                                }
                              </div>
                              {!isConfirmed && (
                                <button
                                  disabled={calEntryVerifying}
                                  onClick={() => doAction('confirm')}
                                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                                >
                                  Confirmar
                                </button>
                              )}
                            </div>
                          )}

                          {/* Payment status */}
                          <div className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200">
                            <div>
                              <p className="text-xs text-nude-400 mb-0.5">Pago</p>
                              {isPaid
                                ? <span className="text-sm font-medium text-green-700">✓ Verificado</span>
                                : <span className="text-sm font-medium text-amber-600">💰 Pendiente</span>
                              }
                            </div>
                            {!isPaid && (
                              <button
                                disabled={calEntryVerifying}
                                onClick={() => doAction('verify_payment')}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                              >
                                {calEntryVerifying ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Verificar'}
                              </button>
                            )}
                          </div>
                        </div>

                        {calEntryError && <p className="text-red-500 text-sm mb-3">{calEntryError}</p>}

                        {/* Action buttons — only when not cancelled */}
                        {(entity as any).status !== 'cancelled' && !calAction && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => setCalAction('reschedule')}
                              className="flex-1 px-3 py-2 border border-indigo-300 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
                            >
                              🗓 Reprogramar
                            </button>
                            <button
                              onClick={() => setCalAction('cancel')}
                              className="flex-1 px-3 py-2 border border-red-300 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors"
                            >
                              ✕ Cancelar reserva
                            </button>
                          </div>
                        )}

                        {/* Reschedule panel */}
                        {calAction === 'reschedule' && (
                          <div className="mt-3 space-y-3">
                            <p className="text-xs font-semibold text-nude-600 uppercase tracking-wide">Nueva fecha y hora</p>
                            <input
                              type="date"
                              min={new Date().toISOString().slice(0, 10)}
                              value={rescheduleDate}
                              onChange={async (e) => {
                                const d = e.target.value
                                setRescheduleDate(d)
                                setRescheduleTime('')
                                setRescheduleSlots([])
                                if (d) {
                                  setRescheduleLoading(true)
                                  try {
                                    const res = await fetch(`/api/booking/slots?date=${d}`, { credentials: 'include' })
                                    const data = await res.json()
                                    setRescheduleSlots(data.slots || [])
                                  } catch {}
                                  finally { setRescheduleLoading(false) }
                                }
                              }}
                              className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm text-nude-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                            />
                            {rescheduleLoading && <p className="text-xs text-nude-400">Cargando horarios...</p>}
                            {rescheduleSlots.length > 0 && (
                              <div className="grid grid-cols-3 gap-1.5">
                                {rescheduleSlots.map(slot => (
                                  <button
                                    key={slot}
                                    onClick={() => setRescheduleTime(slot)}
                                    className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${rescheduleTime === slot ? 'bg-rose-500 text-white border-rose-500' : 'border-cream-300 text-nude-600 hover:bg-cream-50'}`}
                                  >
                                    {slot}hs
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                disabled={!rescheduleDate || !rescheduleTime || rescheduleLoading}
                                onClick={async () => {
                                  setRescheduleLoading(true)
                                  try {
                                    const res = await fetch('/api/admin/manage-booking', {
                                      method: 'POST', credentials: 'include',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: calEntry!.id, type: calEntry!.type === 'class' ? 'scheduled_class' : 'reservation', action: 'reschedule', newDate: rescheduleDate, newTime: rescheduleTime }),
                                    })
                                    if (res.ok) {
                                      if (calEntry!.type === 'reservation') {
                                        setReservations(prev => prev.map(x => x.id === calEntry!.id ? { ...x, date: rescheduleDate, time: rescheduleTime } : x))
                                      } else {
                                        setScheduledClasses(prev => prev.map(x => x.id === calEntry!.id ? { ...x, date: rescheduleDate, time: rescheduleTime } : x))
                                      }
                                      closeCalModal()
                                    } else {
                                      const d = await res.json().catch(() => ({}))
                                      setCalEntryError(d.error || 'Error al reprogramar')
                                    }
                                  } catch { setCalEntryError('Error de red') }
                                  finally { setRescheduleLoading(false) }
                                }}
                                className="flex-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                              >
                                {rescheduleLoading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Confirmar reprogramación'}
                              </button>
                              <button
                                onClick={() => setCalAction(null)}
                                className="px-3 py-2 border border-cream-300 text-nude-500 text-xs font-semibold rounded-xl hover:bg-cream-50 transition-colors"
                              >
                                Volver
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Cancel panel */}
                        {calAction === 'cancel' && (
                          <div className="mt-3 space-y-3">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                              <p className="text-sm text-red-700">¿Confirmar la cancelación? Se notificará al cliente por email.</p>
                              {c?.userPackId && (
                                <p className="text-xs text-red-600 mt-1">Las clases usadas del pack serán restituidas.</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                disabled={calEntryVerifying}
                                onClick={async () => {
                                  setCalEntryVerifying(true)
                                  setCalEntryError('')
                                  try {
                                    const res = await fetch('/api/admin/manage-booking', {
                                      method: 'POST', credentials: 'include',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: calEntry!.id, type: calEntry!.type === 'class' ? 'scheduled_class' : 'reservation', action: 'cancel' }),
                                    })
                                    if (res.ok) {
                                      if (calEntry!.type === 'reservation') {
                                        setReservations(prev => prev.map(x => x.id === calEntry!.id ? { ...x, status: 'cancelled' as const } : x))
                                      } else {
                                        setScheduledClasses(prev => prev.map(x => x.id === calEntry!.id ? { ...x, status: 'cancelled' as const } : x))
                                      }
                                      closeCalModal()
                                    } else {
                                      const d = await res.json().catch(() => ({}))
                                      setCalEntryError(d.error || 'Error al cancelar')
                                    }
                                  } catch { setCalEntryError('Error de red') }
                                  finally { setCalEntryVerifying(false) }
                                }}
                                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                              >
                                {calEntryVerifying ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Sí, cancelar'}
                              </button>
                              <button
                                onClick={() => setCalAction(null)}
                                className="px-3 py-2 border border-cream-300 text-nude-500 text-xs font-semibold rounded-xl hover:bg-cream-50 transition-colors"
                              >
                                Volver
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {activeTab === 'reglamento' && (
              <div>
                <h2 className="font-display text-xl font-semibold text-rose-800 mb-2">Reglamento del estudio</h2>
                <p className="text-nude-500 text-sm mb-4">
                  Este texto se muestra a los usuarios antes de cada reserva. Usá *Título* para negritas y - para listas.
                </p>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      const ta = document.getElementById('reglamento-textarea') as HTMLTextAreaElement
                      if (!ta) return
                      const start = ta.selectionStart
                      const end = ta.selectionEnd
                      const text = reglamentoText
                      if (start !== end) {
                        const selected = text.slice(start, end)
                        setReglamentoText(text.slice(0, start) + '*' + selected + '*' + text.slice(end))
                      } else {
                        const newText = text.slice(0, start) + '*Título*' + text.slice(end)
                        setReglamentoText(newText)
                      }
                    }}
                    className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-rose-700 rounded-lg text-sm font-bold transition-colors"
                    title="Insertar título en negrita"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ta = document.getElementById('reglamento-textarea') as HTMLTextAreaElement
                      if (!ta) return
                      const start = ta.selectionStart
                      const text = reglamentoText
                      const lineStart = text.lastIndexOf('\n', start - 1) + 1
                      const before = text.slice(0, lineStart)
                      const after = text.slice(lineStart)
                      if (after.startsWith('- ')) {
                        setReglamentoText(before + after.slice(2))
                      } else {
                        setReglamentoText(before + '- ' + after)
                      }
                    }}
                    className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-rose-700 rounded-lg text-sm transition-colors"
                    title="Insertar/quitar item de lista"
                  >
                    • Lista
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <textarea
                      id="reglamento-textarea"
                      value={reglamentoText}
                      onChange={e => setReglamentoText(e.target.value)}
                      rows={20}
                      style={{ minHeight: '500px' }}
                      className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none font-mono text-sm resize-y"
                      placeholder="Ingresá el reglamento aquí..."
                    />
                  </div>
                  <div className="border border-cream-200 rounded-xl p-4 overflow-y-auto text-sm leading-relaxed" style={{ minHeight: '500px', maxHeight: '600px' }}>
                    <p className="text-xs text-nude-400 uppercase mb-3 font-medium">Vista previa</p>
                    {reglamentoText.split('\n').map((line, i) => {
                      if (line.startsWith('*') && line.endsWith('*')) {
                        return <p key={i} className="font-semibold text-rose-800 mt-4 mb-1">{line.slice(1, -1)}</p>
                      }
                      if (line.startsWith('- ')) {
                        return <p key={i} className="text-nude-700 pl-4 mb-1">• {line.slice(2)}</p>
                      }
                      return line ? <p key={i} className="text-nude-700 mb-1">{line}</p> : <br key={i} />
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={async () => {
                      await fetch('/api/admin/reglamento', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reglamento: reglamentoText }),
                      })
                    }}
                    className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Guardar reglamento
                  </button>
                </div>
              </div>
            )}
            </div>
            {showPreview && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ height: '85vh' }} onClick={e => e.stopPropagation()}>
                  <div className="h-12 bg-cream-100 flex items-center justify-between px-4 text-sm text-nude-600 font-medium shrink-0 rounded-t-2xl">
                    <span>Vista previa del sitio</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPreviewKey(k => k + 1)} className="hover:text-rose-500 transition-colors">↺ Actualizar</button>
                      <button onClick={() => setShowPreview(false)} className="hover:text-rose-500 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <iframe
                    key={previewKey}
                    src="/"
                    className="flex-1 w-full border-0 rounded-b-2xl"
                    title="Site preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function validateField(value: string, type: string): { valid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { valid: true }
  }

  switch (type) {
    case 'url':
      try {
        new URL(value)
        return { valid: true }
      } catch {
        return { valid: false, error: 'Ingresá una URL válida (ej: https://instagram.com/usuario)' }
      }
    case 'tel':
      const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '')
      if (!/^\+?\d+$/.test(cleanPhone)) {
        return { valid: false, error: 'Solo números (sin espacios ni guiones)' }
      }
      if (cleanPhone.length < 8) {
        return { valid: false, error: 'El número es muy corto (mínimo 8 dígitos)' }
      }
      if (cleanPhone.length > 15) {
        return { valid: false, error: 'El número es muy largo (máximo 15 dígitos)' }
      }
      return { valid: true }
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return { valid: false, error: 'Ingresá un email válido (ej: contacto@ejemplo.com)' }
      }
      return { valid: true }
    default:
      return { valid: true }
  }
}

function FormField({
  label,
  help,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  help?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  const validation = validateField(value, type)
  const showError = !validation.valid && value.length > 0

  return (
    <div>
      <label className="block text-sm font-medium text-rose-700 mb-1">{label}</label>
      {help && <p className="text-xs text-nude-400 mb-2">{help}</p>}
      <input
        type={type === 'tel' ? 'text' : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
          showError 
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' 
            : 'border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
        }`}
      />
      {showError && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
          {validation.error}
        </p>
      )}
      {validation.valid && value.length > 0 && (type === 'url' || type === 'tel' || type === 'email') && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-green-500 rounded-full" />
          ✓ Válido
        </p>
      )}
    </div>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return hours === 1 ? '1 hora' : `${hours} horas`
  }
  return `${hours}h ${mins}min`
}

function ServiceEditor({
  service,
  onUpdate,
  onRemove,
}: {
  service: ServiceConfig
  onUpdate: (updates: Partial<ServiceConfig>) => void
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        onUpdate({ image: data.url })
      } else {
        alert(data.error || 'Error al subir imagen')
      }
    } catch {
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4 sm:p-5 bg-sage-50 rounded-xl border border-sage-200">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <div 
            className="w-24 h-24 rounded-xl bg-white border-2 border-dashed border-sage-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-sage-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-sage-400 animate-spin" />
            ) : service.image ? (
              <img src={service.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-2">
                <ImageIcon className="w-6 h-6 text-sage-300 mx-auto" />
                <span className="text-xs text-sage-400 mt-1 block">Subir foto</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={service.name}
              onChange={e => onUpdate({ name: e.target.value })}
              placeholder="Nombre del servicio"
              className="flex-1 px-3 py-2 rounded-lg border border-sage-200 focus:border-sage-400 outline-none text-sage-800 font-medium"
            />
            <button
              onClick={onRemove}
              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Eliminar servicio"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-nude-500 mb-1">Precio (ARS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nude-400">$</span>
                <input
                  type="number"
                  value={service.price || ''}
                  onChange={e => onUpdate({ price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-sage-200 focus:border-sage-400 outline-none"
                />
              </div>
              {service.price > 0 && (
                <span className="text-xs text-sage-600 mt-1 block">
                  Se muestra: {formatPrice(service.price)}
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs text-nude-500 mb-1">
                Duración: {formatDuration(service.durationMinutes || 60)}
              </label>
              <input
                type="range"
                min={5}
                max={240}
                step={5}
                value={service.durationMinutes || 60}
                onChange={e => {
                  const mins = parseInt(e.target.value)
                  onUpdate({ 
                    durationMinutes: mins,
                    duration: formatDuration(mins)
                  })
                }}
                className="w-full h-2 bg-sage-200 rounded-lg appearance-none cursor-pointer accent-sage-500"
              />
              <div className="flex justify-between text-xs text-nude-400 mt-1">
                <span>5 min</span>
                <span>4 horas</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-nude-500 mb-1">Descripción</label>
            <textarea
              value={service.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Describí brevemente el servicio..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-sage-200 focus:border-sage-400 outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PackEditor({
  pack,
  onUpdate,
  onRemove,
}: {
  pack: PackConfig
  onUpdate: (updates: Partial<PackConfig>) => void
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        onUpdate({ image: data.url })
      } else {
        alert(data.error || 'Error al subir imagen')
      }
    } catch {
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`p-4 sm:p-5 rounded-xl border ${pack.paused ? 'bg-amber-50 border-amber-200' : 'bg-violet-50 border-violet-200'}`}>
      {pack.paused && (
        <div className="flex items-center gap-2 text-amber-700 text-sm mb-3 font-medium">
          <Pause className="w-4 h-4" />
          Pack pausado - no visible para los usuarios
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <div 
            className={`w-24 h-24 rounded-xl bg-white border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${pack.paused ? 'border-amber-300 hover:border-amber-400 opacity-60' : 'border-violet-300 hover:border-violet-400'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            ) : pack.image ? (
              <img src={pack.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-2">
                <ImageIcon className="w-6 h-6 text-violet-300 mx-auto" />
                <span className="text-xs text-violet-400 mt-1 block">Subir foto</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={pack.name}
              onChange={e => onUpdate({ name: e.target.value })}
              placeholder="Nombre del pack (ej: Pack 8 Clases)"
              className="flex-1 px-3 py-2 rounded-lg border border-violet-200 focus:border-violet-400 outline-none text-violet-800 font-medium"
            />
            <button
              onClick={onRemove}
              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Eliminar pack"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-nude-500 mb-1">Cantidad de clases</label>
              <input
                type="number"
                value={pack.classCount || ''}
                onChange={e => onUpdate({ classCount: parseInt(e.target.value) || 0 })}
                placeholder="4"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-violet-200 focus:border-violet-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-nude-500 mb-1">Precio (ARS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nude-400">$</span>
                <input
                  type="number"
                  value={pack.price || ''}
                  onChange={e => onUpdate({ price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-violet-200 focus:border-violet-400 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-nude-500 mb-1">Validez (días)</label>
              <input
                type="number"
                value={pack.validityDays || ''}
                onChange={e => onUpdate({ validityDays: parseInt(e.target.value) || 30 })}
                placeholder="30"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-violet-200 focus:border-violet-400 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onUpdate({ paused: !pack.paused })}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pack.paused
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                }`}
              >
                {pack.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {pack.paused ? 'Activar' : 'Pausar'}
              </button>
            </div>
          </div>

          {pack.price > 0 && pack.classCount > 0 && (
            <p className="text-xs text-violet-600">
              Precio por clase: {formatPrice(Math.round(pack.price / pack.classCount))}
            </p>
          )}

          <div>
            <label className="block text-xs text-nude-500 mb-1">Descripción</label>
            <textarea
              value={pack.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Describí brevemente el pack..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-violet-200 focus:border-violet-400 outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

