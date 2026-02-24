'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Plus, Trash2, Eye, EyeOff, Lock, Check, AlertCircle, Loader2, Image as ImageIcon, CreditCard, Link2, Unlink, Key, Mail, Pause, Play, Calendar, Clock, X, LogOut } from 'lucide-react'
import type { FullConfig, ProductConfig, ServiceConfig, SiteConfig, BookingConfig, RecurringSchedule, DateException, Reservation, PackConfig } from '@/data/config'
import { defaultConfig, formatPrice } from '@/data/config'
import ScheduleEditor from '@/components/admin/ScheduleEditor'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import dynamic from 'next/dynamic'
const ReglamentoModal = dynamic(() => import('@/components/ReglamentoModal'), { ssr: false })

interface MercadoPagoStatus {
  connected: boolean
  userId?: string
  connectedAt?: number
  feeEnabled?: boolean
  feePercentage?: number
}

function PaymentRow({ p, onVerified }: { p: any; onVerified: (id: string) => void }) {
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [verified, setVerified] = useState(false)

  const handleVerify = async () => {
    setVerifying(true)
    setVerifyError('')
    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, type: p.type }),
      })
      if (res.ok) {
        setVerified(true)
        setTimeout(() => onVerified(p.id), 800)
      } else {
        const data = await res.json().catch(() => ({}))
        setVerifyError(data.error || `Error ${res.status}`)
      }
    } catch {
      setVerifyError('Error de red')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="bg-white border border-cream-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-rose-800">{p.name}</p>
        <p className="text-sm text-nude-500 truncate">
          {new Date(p.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {p.time}hs · {p.service}
        </p>
        <p className="text-xs text-nude-400 mt-1">
          {p.method === 'alias' ? '💳 Transferencia' : p.method === 'efectivo' ? '💵 Efectivo' : '—'}
          {p.price > 0 && ` · $${p.price.toLocaleString('es-AR')}`}
        </p>
        {verifyError && <p className="text-xs text-red-500 mt-1">{verifyError}</p>}
      </div>
      <button
        onClick={handleVerify}
        disabled={verifying || verified}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 shrink-0 ${
          verified
            ? 'bg-green-100 text-green-700'
            : 'bg-green-500 hover:bg-green-600 text-white disabled:opacity-60'
        }`}
      >
        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : verified ? '✓ Verificado' : '✓ Verificar'}
      </button>
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
  const [orders, setOrders] = useState<{ id: string; items: { name: string; quantity: number; price: number }[]; serviceItems: { name: string; quantity: number; price: number }[]; selectedSlots: { serviceName?: string; date: string; time: string; status?: 'pending' | 'completed' | 'absent' }[]; customer: { name: string; email: string; phone: string }; total: number; status: string; deliveryStatus?: 'pending' | 'delivered'; createdAt: number }[]>([])
  const [activeTab, setActiveTab] = useState<'site' | 'products' | 'services' | 'packs' | 'booking' | 'pedidos' | 'mercadopago' | 'pagos' | 'calendario' | 'reglamento'>('site')
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [hasChanges, setHasChanges] = useState(false)
  
  const [mpStatus, setMpStatus] = useState<MercadoPagoStatus>({ connected: false })
  const [mpLoading, setMpLoading] = useState(false)
  const [feeStatus, setFeeStatus] = useState<{ enabled: boolean; percentage: number; developmentPaid: boolean }>({ enabled: true, percentage: 5, developmentPaid: false })
  const [payingDev, setPayingDev] = useState(false)

  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [reglamentoText, setReglamentoText] = useState('')
  const [showReglamentoPreview, setShowReglamentoPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

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
    
    fetch('/api/oauth/status')
      .then(res => res.json())
      .then(data => setMpStatus(data))
      .catch(() => {})
    
    fetch('/api/fee')
      .then(res => res.json())
      .then(data => setFeeStatus(data))
      .catch(() => {})
    
    fetch('/api/admin/reservations')
      .then(res => res.json())
      .then(data => setReservations(data.reservations || []))
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
      .then(data => setReglamentoText(data.reglamento || ''))
      .catch(() => {})

    const params = new URLSearchParams(window.location.search)
    if (params.get('dev_payment') === 'success') {
      fetch('/api/fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ developmentPaid: true }),
      }).then(() => {
        setFeeStatus(prev => ({ ...prev, developmentPaid: true, enabled: false }))
        window.history.replaceState({}, '', '/admin')
        alert('¡Gracias por tu pago! La comisión ha sido desactivada.')
      })
    }
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

  const addProduct = () => {
    const newProduct: ProductConfig = {
      id: `producto-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      category: 'accesorios',
      image: '',
      featured: false,
    }
    setProducts([...products, newProduct])
    markChanged()
  }

  const updateProduct = (index: number, updates: Partial<ProductConfig>) => {
    const updated = [...products]
    updated[index] = { ...updated[index], ...updates }
    setProducts(updated)
    markChanged()
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
    markChanged()
  }

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
              {(['site', 'products', 'services', 'packs', 'booking', 'pedidos', 'mercadopago'] as const).map(tab => (
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
                  {tab === 'products' && '🛍️ Productos'}
                  {tab === 'services' && '💆 Servicios'}
                  {tab === 'packs' && '📦 Packs'}
                  {tab === 'booking' && '📅 Reservas'}
                  {tab === 'pedidos' && '📦 Pedidos'}
                  {tab === 'mercadopago' && '💳 MercadoPago'}
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
                💸 Pagos
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

          <div className={showPreview ? 'flex gap-0 h-[calc(100vh-200px)] overflow-hidden' : ''}>
            <div className={showPreview ? 'flex-1 overflow-y-auto p-6' : 'w-full p-6'}>
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
                    
                    <div>
                      <label className="block text-sm font-medium text-rose-700 mb-1">Opciones de entrega de productos</label>
                      <p className="text-xs text-nude-400 mb-2">Configurá cómo coordinás la entrega de productos</p>
                      <select
                        value={site.deliveryMode || 'both'}
                        onChange={e => { setSite({ ...site, deliveryMode: e.target.value as 'pickup' | 'shipping' | 'both' }); markChanged() }}
                        className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
                      >
                        <option value="pickup">Solo retiro en persona</option>
                        <option value="shipping">Solo envíos</option>
                        <option value="both">Retiro y envíos</option>
                      </select>
                    </div>
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
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-rose-800">Tus Productos</h2>
                    <p className="text-nude-500 text-sm mt-1">Accesorios, ropa, equipamiento y productos que vendes</p>
                  </div>
                  <button
                    onClick={addProduct}
                    disabled={!site.productsEnabled}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Producto
                  </button>
                </div>

                <div className="p-4 bg-cream-50 rounded-xl border border-cream-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={site.productsEnabled || false}
                      onChange={e => { setSite({ ...site, productsEnabled: e.target.checked }); markChanged() }}
                      className="w-5 h-5 rounded border-cream-300 text-rose-500 focus:ring-rose-400"
                    />
                    <div>
                      <span className="font-medium text-rose-800">Habilitar venta de productos</span>
                      <p className="text-sm text-nude-500">Muestra la seccion de productos en la pagina principal</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  {products.map((product, index) => (
                    <ProductEditor
                      key={product.id}
                      product={product}
                      onUpdate={updates => updateProduct(index, updates)}
                      onRemove={() => removeProduct(index)}
                    />
                  ))}
                  {products.length === 0 && (
                    <div className="text-center py-12 text-nude-400">
                      No hay productos. Hacé clic en "Agregar Producto" para empezar.
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

                <div className="grid lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-amber-700 mb-3 flex items-center gap-2">
                      📦 Productos a entregar ({orders.filter(o => o.items.length > 0 && o.deliveryStatus !== 'delivered').length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {orders
                        .filter(o => o.items.length > 0 && o.deliveryStatus !== 'delivered')
                        .sort((a, b) => b.createdAt - a.createdAt)
                        .map(order => (
                          <div
                            key={order.id}
                            className="p-4 bg-amber-50 rounded-xl border border-amber-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-amber-800">{order.customer.name}</p>
                                <p className="text-xs text-amber-600">{order.customer.phone}</p>
                              </div>
                              <p className="text-xs text-amber-500">
                                {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <div className="space-y-1 mb-3">
                              {order.items.map((item, idx) => (
                                <p key={idx} className="text-sm text-amber-700">• {item.name} x{item.quantity}</p>
                              ))}
                            </div>
                            <button
                              onClick={async () => {
                                await fetch('/api/admin/orders', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ orderId: order.id, deliveryStatus: 'delivered' })
                                })
                                setOrders(orders.map(o => o.id === order.id ? { ...o, deliveryStatus: 'delivered' } : o))
                              }}
                              className="w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                            >
                              ✓ Marcar como entregado
                            </button>
                          </div>
                        ))}
                      {orders.filter(o => o.items.length > 0 && o.deliveryStatus !== 'delivered').length === 0 && (
                        <p className="text-nude-400 text-sm text-center py-8">No hay productos pendientes</p>
                      )}
                    </div>
                  </div>

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
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-display text-xl font-semibold text-rose-800">Detalle del Turno</h3>
                        <button onClick={() => setSelectedReservation(null)} className="text-nude-400 hover:text-nude-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
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
                        <div className="border-t pt-4">
                          <p className="text-xs text-nude-400 uppercase mb-2">Cliente</p>
                          <p className="font-medium">{selectedReservation.customerName}</p>
                          <p className="text-sm text-nude-600">{selectedReservation.customerEmail}</p>
                          <p className="text-sm text-nude-600">{selectedReservation.customerPhone}</p>
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

            {activeTab === 'mercadopago' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="font-display text-xl font-semibold text-rose-800">MercadoPago</h2>
                  <p className="text-nude-500 text-sm mt-1">
                    Configuracion de pagos y comisiones
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={site.mercadopagoEnabled !== false}
                      onChange={e => { setSite({ ...site, mercadopagoEnabled: e.target.checked }); markChanged() }}
                      className="w-5 h-5 rounded border-blue-300 text-blue-500 focus:ring-blue-400"
                    />
                    <div>
                      <span className="font-medium text-blue-800">Habilitar pagos con MercadoPago</span>
                      <p className="text-sm text-nude-500">Permite cobrar por productos, planes y packs mediante MercadoPago</p>
                    </div>
                  </label>
                </div>

                {!site.mercadopagoEnabled && (
                  <div className="mt-4 p-4 bg-cream-50 rounded-xl border border-cream-200">
                    <h4 className="font-medium text-rose-800 mb-3">Datos de transferencia (Alias/CVU)</h4>
                    <div className="grid gap-3">
                      {(['alias', 'cbu', 'banco', 'titular'] as const).map(field => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-rose-700 mb-1 capitalize">{field === 'cbu' ? 'CBU/CVU' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                          <input
                            type="text"
                            value={(site?.aliasConfig as any)?.[field] || ''}
                            onChange={e => {
                              setSite({ ...site, aliasConfig: { ...(site.aliasConfig as any || {}), [field]: e.target.value } })
                              markChanged()
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-cream-200 focus:border-rose-400 outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!feeStatus.developmentPaid && (
                  <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-amber-800 mb-1">Comisión activa: {feeStatus.percentage}%</h3>
                        <p className="text-sm text-amber-700 mb-4">
                          Se cobra una comisión del {feeStatus.percentage}% en cada venta. 
                          Pagando el desarrollo, eliminás esta comisión para siempre.
                        </p>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg mb-4">
                          <span className="font-medium text-amber-800">Pago único</span>
                          <span className="text-2xl font-bold text-amber-700">$300.000</span>
                        </div>
                        <button
                          onClick={async () => {
                            setPayingDev(true)
                            try {
                              const res = await fetch('/api/checkout/development', { method: 'POST' })
                              const data = await res.json()
                              if (data.init_point) {
                                window.location.href = data.init_point
                              }
                            } catch {
                              alert('Error al crear el pago')
                            }
                            setPayingDev(false)
                          }}
                          disabled={payingDev}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-5 h-5" />
                          {payingDev ? 'Procesando...' : 'Pagar y eliminar comisión'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {feeStatus.developmentPaid && (
                  <div className="p-6 bg-sage-50 rounded-xl border border-sage-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-sage-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sage-800">¡Desarrollo pagado!</h3>
                        <p className="text-sm text-sage-600">
                          No se cobra ninguna comisión en tus ventas
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-cream-200 pt-6">
                  <h3 className="font-display text-lg font-semibold text-rose-800 mb-4">Conexión de cuenta</h3>
                  
                  {mpStatus.connected ? (
                    <div className="p-4 bg-sage-50 rounded-xl border border-sage-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-sage-600" />
                          <div>
                            <span className="font-medium text-sage-800">Cuenta conectada</span>
                            <p className="text-sm text-sage-600">ID: {mpStatus.userId}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm('¿Seguro que querés desconectar tu cuenta?')) return
                            setMpLoading(true)
                            await fetch('/api/oauth/status', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              credentials: 'include',
                              body: JSON.stringify({ action: 'disconnect' }),
                            })
                            setMpStatus({ connected: false })
                            setMpLoading(false)
                          }}
                          disabled={mpLoading}
                          className="text-rose-500 hover:text-rose-700 text-sm flex items-center gap-1"
                        >
                          <Unlink className="w-4 h-4" />
                          Desconectar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-cream-50 rounded-xl border border-cream-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-rose-800">No hay cuenta conectada</span>
                          <p className="text-sm text-nude-500">Conectá tu MercadoPago para recibir pagos</p>
                        </div>
                        <a
                          href="/api/oauth/connect"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Link2 className="w-4 h-4" />
                          Conectar
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-nude-50 rounded-xl border border-nude-200">
                  <h4 className="font-medium text-nude-700 mb-2">💡 ¿Cómo funciona?</h4>
                  <ul className="text-sm text-nude-600 space-y-1">
                    <li>• Conectás tu cuenta de MercadoPago</li>
                    <li>• Los clientes pagan y el dinero va a tu cuenta</li>
                    {!feeStatus.developmentPaid && <li>• Se cobra {feeStatus.percentage}% de comisión hasta pagar el desarrollo</li>}
                    {feeStatus.developmentPaid && <li>• ✅ Sin comisiones - desarrollo pagado</li>}
                  </ul>
                </div>
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
                  <div className="space-y-3">
                    {pendingPayments.map((p: any) => (
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
                />
              </div>
            )}

            {activeTab === 'reglamento' && (
              <div>
                <h2 className="font-display text-xl font-semibold text-rose-800 mb-2">Reglamento del estudio</h2>
                <p className="text-nude-500 text-sm mb-6">
                  Este texto se muestra a los usuarios antes de cada reserva. Usá *Título* para negritas y - para listas.
                </p>
                <textarea
                  value={reglamentoText}
                  onChange={e => setReglamentoText(e.target.value)}
                  rows={16}
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none font-mono text-sm resize-y"
                  placeholder="Ingresá el reglamento aquí..."
                />
                <div className="flex gap-3 mt-4">
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
                  <button
                    onClick={() => setShowReglamentoPreview(true)}
                    className="px-6 py-2.5 border-2 border-rose-300 text-rose-700 rounded-xl font-medium hover:bg-rose-50 transition-colors"
                  >
                    Vista previa
                  </button>
                </div>
                {showReglamentoPreview && (
                  <ReglamentoModal
                    mode="readonly"
                    customText={reglamentoText}
                    onClose={() => setShowReglamentoPreview(false)}
                  />
                )}
              </div>
            )}
            </div>
            {showPreview && (
              <div className="w-[420px] border-l border-cream-200 flex flex-col shrink-0">
                <div className="h-10 bg-cream-100 flex items-center justify-between px-4 text-xs text-nude-500 font-medium shrink-0">
                  <span>Vista previa del sitio</span>
                  <button onClick={() => setPreviewKey(k => k + 1)} className="hover:text-rose-500 transition-colors">↺ Actualizar</button>
                </div>
                <iframe
                  key={previewKey}
                  src="/"
                  className="flex-1 w-full border-0"
                  title="Site preview"
                />
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

function ProductEditor({
  product,
  onUpdate,
  onRemove,
}: {
  product: ProductConfig
  onUpdate: (updates: Partial<ProductConfig>) => void
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
    <div className={`p-4 sm:p-5 rounded-xl border ${product.paused ? 'bg-amber-50 border-amber-200' : 'bg-cream-50 border-cream-200'}`}>
      {product.paused && (
        <div className="flex items-center gap-2 text-amber-700 text-sm mb-3 font-medium">
          <Pause className="w-4 h-4" />
          Producto pausado - no visible en la tienda
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <div 
            className={`w-24 h-24 rounded-xl bg-white border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${product.paused ? 'border-amber-300 hover:border-amber-400 opacity-60' : 'border-cream-300 hover:border-rose-400'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
            ) : product.image ? (
              <img src={product.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-2">
                <ImageIcon className="w-6 h-6 text-cream-400 mx-auto" />
                <span className="text-xs text-cream-400 mt-1 block">Subir foto</span>
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
              value={product.name}
              onChange={e => onUpdate({ name: e.target.value })}
              placeholder="Nombre del producto"
              className="flex-1 px-3 py-2 rounded-lg border border-cream-200 focus:border-rose-400 outline-none text-rose-800 font-medium"
            />
            <button
              onClick={onRemove}
              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Eliminar producto"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-nude-500 mb-1">Precio (ARS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nude-400">$</span>
                <input
                  type="number"
                  value={product.price || ''}
                  onChange={e => onUpdate({ price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-cream-200 focus:border-rose-400 outline-none"
                />
              </div>
              {product.price > 0 && (
                <span className="text-xs text-sage-600 mt-1 block">
                  Se muestra: {formatPrice(product.price)}
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs text-nude-500 mb-1">Categoría</label>
              <select
                value={product.category}
                onChange={e => onUpdate({ category: e.target.value as ProductConfig['category'] })}
                className="w-full px-3 py-2 rounded-lg border border-cream-200 focus:border-rose-400 outline-none"
              >
                <option value="accesorios">🎯 Accesorios</option>
                <option value="ropa">👕 Ropa</option>
                <option value="equipamiento">🏋️ Equipamiento</option>
                <option value="suplementos">💊 Suplementos</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={product.featured}
                  onChange={e => onUpdate({ featured: e.target.checked })}
                  className="w-4 h-4 rounded border-cream-300 text-rose-500 focus:ring-rose-400"
                />
                <span className="text-sm text-rose-700">⭐ Destacado</span>
              </label>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onUpdate({ paused: !product.paused })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  product.paused
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                }`}
              >
                {product.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {product.paused ? 'Activar' : 'Pausar'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-xs text-nude-500 mb-1">
                <input
                  type="checkbox"
                  checked={product.trackStock}
                  onChange={e => onUpdate({ trackStock: e.target.checked, stock: e.target.checked ? (product.stock || 0) : undefined })}
                  className="w-3 h-3 rounded border-cream-300 text-rose-500"
                />
                Controlar stock
              </label>
              {product.trackStock && (
                <input
                  type="number"
                  value={product.stock ?? ''}
                  onChange={e => onUpdate({ stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-cream-200 focus:border-rose-400 outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-nude-500 mb-1">Descripción</label>
              <textarea
                value={product.description}
                onChange={e => onUpdate({ description: e.target.value })}
                placeholder="Describí brevemente..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-cream-200 focus:border-rose-400 outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>
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

