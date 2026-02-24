# Pilates Reformer — Full Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add alias/cash payment flow with admin verification, user profile fields (dirección + obra social), reglamento popup, full CMS with preview, weekly calendar views, forgot password, and UI polish.

**Architecture:** Surgical refactor of UI layers only. Existing API routes, Redis storage pattern, and MercadoPago integration stay intact. New features added as new components and API routes following the same patterns already in the codebase.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Redis (ioredis), Nodemailer, existing rose/cream/sage color palette.

---

## Task 1: Extend data models

**Files:**
- Modify: `src/data/config.ts`

**Step 1: Add new interfaces and fields**

Open `src/data/config.ts` and apply these changes:

1. Add `aliasConfig` and `reglamento` to `SiteConfig` interface (after line 12):
```typescript
  aliasConfig?: {
    alias: string
    cbu: string
    banco: string
    titular: string
  }
  reglamento?: string
```

2. Add `paymentStatus` and `paymentMethod` to `Reservation` interface (after `status` field on line 77):
```typescript
  paymentStatus?: 'pending' | 'verified' | 'paid_online'
  paymentMethod?: 'alias' | 'efectivo' | 'mercadopago'
  customerDireccion?: string
  customerObraSocial?: string
```

3. Add `paymentStatus`, `paymentMethod`, `customerDireccion`, `customerObraSocial` to `ScheduledClass` interface (after `status` field on line 125):
```typescript
  paymentStatus?: 'pending' | 'verified' | 'paid_online'
  paymentMethod?: 'alias' | 'efectivo' | 'mercadopago'
  customerDireccion?: string
  customerObraSocial?: string
```

4. Add new `UserProfile` interface after the `User` interface (after line 99):
```typescript
export interface UserProfile {
  userId: string
  direccion: string
  obraSocial: string
  telefono?: string
  updatedAt: number
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd /mnt/win/Users/agusk/Desktop/Stuff/Projects/PilatesReformer && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to these changes).

**Step 3: Commit**

```bash
git add src/data/config.ts
git commit -m "feat: extend data models with payment status, user profile, alias config"
```

---

## Task 2: Extend storage layer

**Files:**
- Modify: `src/lib/storage.ts`

**Step 1: Add new functions at the end of `src/lib/storage.ts`**

```typescript
// ── User Profile ────────────────────────────────────────
const USER_PROFILE_PREFIX = 'corpepilates:user_profile:'

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const redis = getRedis()
    const data = await redis.get(USER_PROFILE_PREFIX + userId)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.set(USER_PROFILE_PREFIX + profile.userId, JSON.stringify(profile))
    return true
  } catch {
    return false
  }
}

// ── Pending Payments ─────────────────────────────────────
export async function getPendingReservations(): Promise<Reservation[]> {
  const reservations = await getReservations()
  return reservations.filter(
    r => r.status !== 'cancelled' && (!r.paymentStatus || r.paymentStatus === 'pending')
  )
}

export async function getPendingScheduledClasses(): Promise<ScheduledClass[]> {
  const classes = await getScheduledClasses()
  return classes.filter(
    c => c.status !== 'cancelled' && (!c.paymentStatus || c.paymentStatus === 'pending')
  )
}
```

Also add the `UserProfile` import at line 1 — update the import:
```typescript
import { FullConfig, defaultConfig, Reservation, User, UserPack, ScheduledClass, UserProfile } from '@/data/config'
```

**Step 2: Verify**

```bash
cd /mnt/win/Users/agusk/Desktop/Stuff/Projects/PilatesReformer && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add src/lib/storage.ts
git commit -m "feat: add user profile and pending payment queries to storage"
```

---

## Task 3: Extend auth lib with forgot/reset password

**Files:**
- Modify: `src/lib/auth.ts`

**Step 1: Add reset token functions at the end of `src/lib/auth.ts`**

```typescript
const RESET_TOKEN_PREFIX = 'corpepilates:admin_reset:'
const RESET_TOKEN_TTL = 30 * 60 // 30 minutes

export async function generateResetToken(): Promise<string> {
  const redis = getRedis()
  const token = crypto.randomBytes(32).toString('hex')
  await redis.setex(RESET_TOKEN_PREFIX + token, RESET_TOKEN_TTL, JSON.stringify({ createdAt: Date.now() }))
  return token
}

export async function validateResetToken(token: string): Promise<boolean> {
  if (!token) return false
  try {
    const redis = getRedis()
    const data = await redis.get(RESET_TOKEN_PREFIX + token)
    return !!data
  } catch {
    return false
  }
}

export async function deleteResetToken(token: string): Promise<void> {
  try {
    const redis = getRedis()
    await redis.del(RESET_TOKEN_PREFIX + token)
  } catch {}
}

export async function sendResetEmail(email: string, resetUrl: string): Promise<{ success: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '465')

  if (!smtpUser || !smtpPass) {
    return { success: false, error: 'Email no configurado en el servidor' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: `Corpe Pilates <${smtpUser}>`,
      to: email,
      subject: 'Recuperar contraseña — Corpe Pilates Admin',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e85d5d; text-align: center;">Corpe Pilates</h2>
          <p style="text-align: center; color: #666;">Recibiste una solicitud para restablecer tu contraseña de administrador.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background: #e85d5d; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Restablecer contraseña
            </a>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px;">
            Este link expira en 30 minutos.<br>
            Si no solicitaste esto, ignorá este email.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}
```

**Step 2: Verify**

```bash
cd /mnt/win/Users/agusk/Desktop/Stuff/Projects/PilatesReformer && npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add reset token and sendResetEmail to auth lib"
```

---

## Task 4: New API routes — user profile

**Files:**
- Create: `src/app/api/user/profile/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getUserSession, getUserById } from '@/lib/storage'
import { getUserProfile, saveUserProfile } from '@/lib/storage'
import { UserProfile } from '@/data/config'

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('user_session')?.value
  if (!token) return null
  const session = await getUserSession(token)
  return session?.userId || null
}

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req)
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const profile = await getUserProfile(userId)
  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req)
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const body = await req.json()
  const profile: UserProfile = {
    userId,
    direccion: body.direccion || '',
    obraSocial: body.obraSocial || '',
    telefono: body.telefono || '',
    updatedAt: Date.now(),
  }
  await saveUserProfile(profile)
  return NextResponse.json({ success: true })
}
```

**Step 2: Commit**

```bash
git add src/app/api/user/profile/route.ts
git commit -m "feat: add user profile API route"
```

---

## Task 5: New API routes — admin verify payment

**Files:**
- Create: `src/app/api/admin/verify-payment/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/auth'
import { getReservations, saveReservation, getScheduledClasses, saveScheduledClass } from '@/lib/storage'
import { sendPaymentVerifiedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('corpepilates_session')?.value
  if (!token || !(await validateSessionToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, type } = await req.json()

  if (type === 'reservation') {
    const reservations = await getReservations()
    const idx = reservations.findIndex(r => r.id === id)
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    reservations[idx] = { ...reservations[idx], paymentStatus: 'verified', status: 'confirmed' }
    await saveReservation(reservations[idx])
    // Send confirmation email
    try {
      await sendPaymentVerifiedEmail(
        reservations[idx].customerEmail,
        reservations[idx].customerName,
        reservations[idx].date,
        reservations[idx].time,
        reservations[idx].serviceName
      )
    } catch {}
    return NextResponse.json({ success: true })
  }

  if (type === 'scheduled_class') {
    const classes = await getScheduledClasses()
    const idx = classes.findIndex(c => c.id === id)
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    classes[idx] = { ...classes[idx], paymentStatus: 'verified' }
    await saveScheduledClass(classes[idx])
    try {
      await sendPaymentVerifiedEmail(
        classes[idx].customerEmail,
        classes[idx].customerName,
        classes[idx].date,
        classes[idx].time,
        'Clase de Pilates Reformer'
      )
    } catch {}
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/verify-payment/route.ts
git commit -m "feat: add admin verify-payment API route"
```

---

## Task 6: Add email helper for payment verification

**Files:**
- Modify: `src/lib/email.ts`

**Step 1: Read current email.ts**

```bash
cat /mnt/win/Users/agusk/Desktop/Stuff/Projects/PilatesReformer/src/lib/email.ts
```

**Step 2: Add `sendPaymentVerifiedEmail` function**

If `src/lib/email.ts` is empty or minimal, create/append this function:

```typescript
import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendPaymentVerifiedEmail(
  to: string,
  name: string,
  date: string,
  time: string,
  serviceName: string
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return
  const transporter = createTransporter()
  const dateDisplay = new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
  await transporter.sendMail({
    from: `Corpe Pilates <${process.env.SMTP_USER}>`,
    to,
    subject: 'Pago confirmado — Tu clase está reservada ✓',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e85d5d;">¡Tu pago fue confirmado!</h2>
        <p>Hola ${name},</p>
        <p>Tu pago fue verificado y tu clase queda confirmada:</p>
        <div style="background: #fdf2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>${serviceName}</strong><br/>
          📅 ${dateDisplay}<br/>
          🕐 ${time}hs
        </div>
        <p style="color: #666; font-size: 14px;">¡Nos vemos en el estudio!</p>
      </div>
    `,
  })
}
```

**Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add sendPaymentVerifiedEmail helper"
```

---

## Task 7: New API routes — forgot/reset password

**Files:**
- Create: `src/app/api/admin/auth/forgot-password/route.ts`
- Create: `src/app/api/admin/auth/reset-password/route.ts`

**Step 1: Create forgot-password route**

```typescript
// src/app/api/admin/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateResetToken, sendResetEmail } from '@/lib/auth'
import { getStoredConfig } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const config = await getStoredConfig()
  const recoveryEmail = config.site?.email
  if (!recoveryEmail) {
    return NextResponse.json({ error: 'No hay email de recuperación configurado' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`
  const token = await generateResetToken()
  const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`

  const result = await sendResetEmail(recoveryEmail, resetUrl)
  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Error al enviar email' }, { status: 500 })
  }

  return NextResponse.json({ success: true, email: recoveryEmail })
}
```

**Step 2: Create reset-password route**

```typescript
// src/app/api/admin/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateResetToken, deleteResetToken, setAdminPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: 'Token o contraseña inválidos' }, { status: 400 })
  }

  const valid = await validateResetToken(token)
  if (!valid) {
    return NextResponse.json({ error: 'El link expiró o ya fue usado' }, { status: 400 })
  }

  await setAdminPassword(password)
  await deleteResetToken(token)
  return NextResponse.json({ success: true })
}
```

**Step 3: Commit**

```bash
git add src/app/api/admin/auth/forgot-password/route.ts src/app/api/admin/auth/reset-password/route.ts
git commit -m "feat: add forgot-password and reset-password API routes"
```

---

## Task 8: Reset password page

**Files:**
- Create: `src/app/admin/reset-password/page.tsx`

**Step 1: Create the page**

```typescript
'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) { setSuccess(true) }
    else { setError(data.error || 'Error al restablecer') }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-500 mb-4">Link inválido o expirado.</p>
          <Link href="/admin" className="text-rose-500 hover:underline">Volver al admin</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold text-rose-800 mb-2">Contraseña actualizada</h2>
          <p className="text-nude-500 mb-6">Tu contraseña fue cambiada exitosamente.</p>
          <Link href="/admin" className="px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors">
            Ir al admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-cream-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Lock className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold text-rose-800">Nueva contraseña</h1>
          <p className="text-nude-500 mt-2">Ingresá tu nueva contraseña de administrador</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nueva contraseña"
              className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none pr-12"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-nude-400">
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirmar contraseña"
            className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-rose-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-400 animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/admin/reset-password/page.tsx
git commit -m "feat: add admin reset-password page"
```

---

## Task 9: ReglamentoModal component

**Files:**
- Create: `src/components/ReglamentoModal.tsx`

**Step 1: Create the component**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ScrollText, CheckCircle } from 'lucide-react'

const DEFAULT_REGLAMENTO = `*Clases y Horarios*
- El estudio ofrece clases semanales de 60 minutos.
- Si por algún motivo no podés asistir, deberás cancelar desde la app con al menos 1 hora de anticipación.

*Cancelaciones y Recuperaciones*
- La posibilidad de recuperar una clase depende de la cancelación hasta una hora antes de que comience y de la disponibilidad de espacio en el estudio.
- El estudio no está obligado a reponer las clases a las que no puedas asistir sin haber cancelado.
- Recuperar una clase es un beneficio, no una obligación.

*Puntualidad*
- Por favor llegá 5 minutos antes de tu clase. Llegar tarde afecta la experiencia del grupo.

*Pagos*
- Los pagos deben realizarse antes o durante la primera clase del mes.
- En caso de no abonar en tiempo y forma, los turnos podrán ser reasignados.

*Conducta*
- Mantener un ambiente respetuoso y tranquilo dentro del estudio.
- Usar ropa cómoda y calcetines antideslizantes.

Al reservar una clase, aceptás respetar este reglamento.`

interface ReglamentoModalProps {
  mode: 'booking' | 'readonly'
  onAccept?: () => void
  onClose: () => void
  customText?: string
}

export default function ReglamentoModal({ mode, onAccept, onClose, customText }: ReglamentoModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const text = customText || DEFAULT_REGLAMENTO

  const handleScroll = () => {
    const el = contentRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40
    if (atBottom) setScrolledToBottom(true)
  }

  useEffect(() => {
    // If content is short enough to not need scrolling, enable immediately
    const el = contentRef.current
    if (el && el.scrollHeight <= el.clientHeight + 40) {
      setScrolledToBottom(true)
    }
  }, [])

  const renderText = (raw: string) =>
    raw.split('\n').map((line, i) => {
      if (line.startsWith('*') && line.endsWith('*')) {
        return <p key={i} className="font-semibold text-rose-800 mt-4 mb-1">{line.slice(1, -1)}</p>
      }
      if (line.startsWith('- ')) {
        return <p key={i} className="text-nude-700 pl-4 mb-1">• {line.slice(2)}</p>
      }
      return line ? <p key={i} className="text-nude-700 mb-1">{line}</p> : <br key={i} />
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cream-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-rose-800">Reglamento del Estudio</h2>
              {mode === 'booking' && (
                <p className="text-xs text-nude-500">Leé hasta el final para continuar</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cream-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-nude-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed"
        >
          {renderText(text)}
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 shrink-0">
          {mode === 'booking' ? (
            <button
              onClick={() => { if (scrolledToBottom && onAccept) onAccept() }}
              disabled={!scrolledToBottom}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                scrolledToBottom
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-cream-200 text-nude-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {scrolledToBottom ? 'Acepto el reglamento' : 'Scroll para leer todo'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ReglamentoModal.tsx
git commit -m "feat: add ReglamentoModal component with scroll-to-accept"
```

---

## Task 10: WeeklyCalendar component

**Files:**
- Create: `src/components/WeeklyCalendar.tsx`

**Step 1: Create the component**

```typescript
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RecurringSchedule, DateException, ScheduledClass, Reservation } from '@/data/config'

interface SlotData {
  time: string
  count: number
  capacity: number
  hasUser?: boolean
  entries?: Array<{
    name: string
    paymentStatus?: string
    id: string
    type: 'class' | 'reservation'
  }>
}

interface WeeklyCalendarProps {
  mode: 'user' | 'admin'
  recurring: RecurringSchedule[]
  exceptions: DateException[]
  capacity: number
  userBookedSlots?: Array<{ date: string; time: string }>
  slotData?: Record<string, SlotData[]> // key: 'YYYY-MM-DD'
  onSlotClick?: (date: string, time: string) => void
  onEntryClick?: (id: string, type: 'class' | 'reservation') => void
}

function getWeekDates(offset: number): Date[] {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7)
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

  const getSlotsForDay = (date: Date): string[] => {
    const dateStr = date.toISOString().split('T')[0]
    const exception = exceptions.find(e => e.date === dateStr)
    if (exception) {
      if (exception.isBlocked) return []
      return exception.slots.map(s => s.start)
    }
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Mon=1, Sun=7
    const recurringDay = recurring.find(r => {
      // Convert: recurring uses 0=Sun or 1=Mon? Check config — DAYS_OF_WEEK: 0=Dom,1=Lun
      const jsDay = date.getDay() // 0=Sun, 1=Mon...
      return r.dayOfWeek === jsDay
    })
    return recurringDay?.slots.map(s => s.start) || []
  }

  const getSlotColor = (dateStr: string, time: string) => {
    const userBooked = userBookedSlots.some(s => s.date === dateStr && s.time === time)
    if (userBooked) return 'bg-blue-500 text-white'
    const data = slotData[dateStr]?.find(s => s.time === time)
    if (!data) return 'bg-green-100 text-green-700 hover:bg-green-200'
    if (data.count >= capacity) return 'bg-red-100 text-red-600 cursor-not-allowed'
    return 'bg-green-100 text-green-700 hover:bg-green-200'
  }

  const isToday = (d: Date) => {
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }

  const isPast = (d: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d < today
  }

  return (
    <div className="w-full">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-rose-600" />
        </button>
        <span className="font-medium text-rose-800 text-sm">
          {days[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} —{' '}
          {days[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-rose-600" />
        </button>
      </div>

      {/* Calendar grid — horizontally scrollable on mobile */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 min-w-[560px]">
          {/* Day headers */}
          {days.map((day, i) => (
            <div
              key={i}
              className={`text-center text-xs font-medium py-2 rounded-t-lg ${
                isToday(day)
                  ? 'bg-rose-500 text-white'
                  : isPast(day)
                  ? 'text-nude-400'
                  : 'text-rose-700'
              }`}
            >
              <div>{DAY_NAMES[i]}</div>
              <div className="text-lg font-semibold">{day.getDate()}</div>
            </div>
          ))}

          {/* Slots per day */}
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
                      disabled={isFull && !userBooked || past}
                      onClick={() => {
                        if (past) return
                        if (mode === 'user' && !isFull) onSlotClick?.(dateStr, time)
                        if (mode === 'admin') {
                          setSelectedSlot(selectedSlot?.date === dateStr && selectedSlot?.time === time ? null : { date: dateStr, time })
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-nude-500">
        {mode === 'user' && (
          <>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Disponible</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Tu turno</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Lleno</span>
          </>
        )}
        {mode === 'admin' && (
          <>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Disponible</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Lleno</span>
          </>
        )}
      </div>

      {/* Admin slot detail panel */}
      {mode === 'admin' && selectedSlot && (
        <div className="mt-4 p-4 bg-cream-50 rounded-xl border border-cream-200">
          <h4 className="font-medium text-rose-800 mb-3">
            {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {selectedSlot.time}hs
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
                   : '⏳ Pago pendiente'}
                </span>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/WeeklyCalendar.tsx
git commit -m "feat: add WeeklyCalendar component for user and admin views"
```

---

## Task 11: Refactor booking wizard (`/reservar`)

**Files:**
- Modify: `src/app/reservar/page.tsx`

This is the most significant change. Replace the entire file content.

**Step 1: Key changes to make**

The current file has `step: 1 | 2 | 3`. We need to:
1. Add step `0` = reglamento modal (shows as overlay before step 1)
2. Add `reglamentoAccepted` state — starts `false`, becomes `true` on accept
3. Add `direccion` and `obraSocial` to the `customer` state object
4. Add `previousProfile` state to store fetched user profile for auto-fill
5. Change step 3 to include dirección + obra social + "Usar datos anteriores" button
6. Change the submit to either go to MercadoPago OR show alias/cash options
7. Add step 4: confirmation/payment pending screen

**Step 2: State additions** (in `ReservarContent` function, after existing state declarations):

```typescript
const [reglamentoAccepted, setReglamentoAccepted] = useState(false)
const [showReglamento, setShowReglamento] = useState(false)
const [reglamentoText, setReglamentoText] = useState('')
const [aliasConfig, setAliasConfig] = useState<SiteConfig['aliasConfig']>(null)
const [previousProfile, setPreviousProfile] = useState<{
  name: string; email: string; phone: string; direccion: string; obraSocial: string
} | null>(null)
const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'alias' | 'efectivo' | null>(null)
const [bookingId, setBookingId] = useState<string>('')
```

Update `customer` state to include new fields:
```typescript
const [customer, setCustomer] = useState({
  name: '', email: '', phone: '', age: '', healthConditions: '',
  direccion: '', obraSocial: ''
})
```

**Step 3: Fetch profile + reglamento in useEffect**

In the existing `useEffect` that fetches config, after setting state, add:
```typescript
// Fetch reglamento text
if (data.site?.reglamento) setReglamentoText(data.site.reglamento)
if (data.site?.aliasConfig) setAliasConfig(data.site.aliasConfig)

// Fetch user profile for auto-fill
fetch('/api/user/profile')
  .then(r => r.json())
  .then(profileData => {
    if (profileData.profile) {
      setPreviousProfile({
        name: '',
        email: '',
        phone: profileData.profile.telefono || '',
        direccion: profileData.profile.direccion || '',
        obraSocial: profileData.profile.obraSocial || '',
      })
    }
  })
  .catch(() => {})
```

**Step 4: Show reglamento before proceeding from step 1**

When user clicks a service card, instead of going directly to step 2:
```typescript
onClick={() => {
  setSelectedService(service)
  if (!reglamentoAccepted) {
    setShowReglamento(true)
  } else {
    setStep(2)
  }
}}
```

On reglamento accept:
```typescript
<ReglamentoModal
  mode="booking"
  onAccept={() => {
    setReglamentoAccepted(true)
    setShowReglamento(false)
    setStep(2)
  }}
  onClose={() => setShowReglamento(false)}
  customText={reglamentoText}
/>
```

**Step 5: Add dirección + obra social to step 3**

After the `healthConditions` textarea, add:
```typescript
<div>
  <label className="block text-sm font-medium text-rose-700 mb-1">
    <MapPin className="w-4 h-4 inline mr-1" />
    Dirección *
  </label>
  <input
    type="text"
    value={customer.direccion}
    onChange={e => setCustomer({ ...customer, direccion: e.target.value })}
    placeholder="Ej: Av. Corrientes 1234, CABA"
    required
    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
  />
</div>
<div>
  <label className="block text-sm font-medium text-rose-700 mb-1">
    Obra social *
  </label>
  <input
    type="text"
    value={customer.obraSocial}
    onChange={e => setCustomer({ ...customer, obraSocial: e.target.value })}
    placeholder="Ej: OSDE / No tengo"
    required
    className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
  />
</div>
```

Add "Usar datos anteriores" button at top of the form in step 3 (when `previousProfile` exists):
```typescript
{previousProfile && (
  <button
    type="button"
    onClick={() => setCustomer(prev => ({ ...prev, ...previousProfile }))}
    className="w-full mb-4 py-2 px-4 border-2 border-dashed border-rose-300 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-50 transition-colors"
  >
    ↩ Usar datos anteriores
  </button>
)}
```

**Step 6: Change handleSubmit for alias/cash flow**

Replace `handleSubmit` to handle both MP and non-MP:
```typescript
const handleSubmit = async (method: 'mercadopago' | 'alias' | 'efectivo') => {
  if (!selectedService || !selectedDate || !selectedTime) return
  if (!customer.name || !customer.email || !customer.phone || !customer.age || !customer.direccion || !customer.obraSocial) {
    setError('Completa todos los campos obligatorios')
    return
  }
  // ... existing validation ...

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
        customer: {
          ...customer,
          direccion: customer.direccion,
          obraSocial: customer.obraSocial,
        },
        paymentMethod: method,
      })
    })

    const data = await res.json()

    // Save profile for next time
    await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direccion: customer.direccion,
        obraSocial: customer.obraSocial,
        telefono: customer.phone,
      })
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
```

**Step 7: Add step 4 — Confirmation screen**

```tsx
{step === 4 && (
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

    {paymentMethod === 'alias' && aliasConfig && (
      <div className="bg-cream-50 rounded-xl p-5 mb-6 text-left border border-cream-200">
        <h3 className="font-medium text-rose-800 mb-3">Datos de transferencia</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-nude-500">Alias</span><span className="font-mono font-medium text-rose-800">{aliasConfig.alias}</span></div>
          <div className="flex justify-between"><span className="text-nude-500">CBU/CVU</span><span className="font-mono font-medium text-rose-800">{aliasConfig.cbu}</span></div>
          <div className="flex justify-between"><span className="text-nude-500">Banco</span><span className="font-medium text-rose-800">{aliasConfig.banco}</span></div>
          <div className="flex justify-between"><span className="text-nude-500">Titular</span><span className="font-medium text-rose-800">{aliasConfig.titular}</span></div>
          <div className="pt-2 border-t border-cream-200 flex justify-between font-semibold">
            <span>Total</span><span className="text-rose-700">{formatPrice(selectedService?.price || 0)}</span>
          </div>
        </div>
      </div>
    )}

    {paymentMethod === 'alias' && siteConfig?.whatsapp && (
      <a
        href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
          `Hola! Hice una reserva para el ${selectedDate} a las ${selectedTime}hs. Te envío el comprobante de transferencia.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full mb-3 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
      >
        Enviar comprobante por WhatsApp
      </a>
    )}

    <Link href="/mi-cuenta" className="w-full block py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors text-center">
      Ver mis reservas
    </Link>
  </div>
)}
```

**Step 8: Update step 3 buttons to show payment options**

Replace the existing submit button area in step 3:

```tsx
{/* Payment options */}
<div className="mt-6 space-y-3">
  {mercadopagoEnabled && (
    <button
      onClick={() => handleSubmit('mercadopago')}
      disabled={submitting || /* same disabled conditions */}
      className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
    >
      <CreditCard className="w-5 h-5" />
      Pagar con MercadoPago
    </button>
  )}
  {!mercadopagoEnabled && aliasConfig && (
    <button
      onClick={() => handleSubmit('alias')}
      disabled={submitting || /* validation */}
      className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
    >
      Reservar y pagar por transferencia
    </button>
  )}
  <button
    onClick={() => handleSubmit('efectivo')}
    disabled={submitting || /* validation */}
    className="w-full py-3 border-2 border-rose-300 text-rose-700 rounded-xl font-medium hover:bg-rose-50 transition-colors disabled:opacity-50"
  >
    Reservar y pagar en efectivo al llegar
  </button>
  {mercadopagoEnabled && (
    <button
      onClick={() => handleSubmit('efectivo')}
      disabled={submitting}
      className="w-full py-2 text-sm text-nude-500 hover:text-nude-700 transition-colors"
    >
      Reservar sin pagar (abonar después)
    </button>
  )}
</div>
```

**Step 9: Import ReglamentoModal and CheckCircle**

Add at top of file:
```typescript
import ReglamentoModal from '@/components/ReglamentoModal'
import { CheckCircle } from 'lucide-react' // add to existing import
```

**Step 10: Fix the `bookingEnabled` check — remove `mercadopagoEnabled` from it**

Line 179 currently shows "Reservas no disponibles" when `!bookingEnabled || !mercadopagoEnabled`. Change to only `!bookingEnabled` since we now support alias/cash payments without MP.

**Step 11: Verify and commit**

```bash
cd /mnt/win/Users/agusk/Desktop/Stuff/Projects/PilatesReformer && npx tsc --noEmit 2>&1 | head -40
git add src/app/reservar/page.tsx
git commit -m "feat: refactor booking wizard with reglamento, profile fields, alias/cash payment"
```

---

## Task 12: Update `/api/booking/create` to accept new fields

**Files:**
- Locate booking create route. Check: `src/app/api/booking/create/route.ts` or check existing route at `src/app/api/booking/slots/route.ts`

**Step 1: Find the create route**

```bash
find /mnt/win/Users/agusk/Desktop/Stuff/Projects/PilatesReformer/src/app/api/booking -type f
```

**Step 2: Update the create route**

In whichever file handles `POST /api/booking/create`, update the `Reservation` object being saved to include:

```typescript
paymentStatus: body.paymentMethod === 'mercadopago' ? 'paid_online' : 'pending',
paymentMethod: body.paymentMethod || 'mercadopago',
customerDireccion: body.customer?.direccion || '',
customerObraSocial: body.customer?.obraSocial || '',
```

Also change the response: when `paymentMethod !== 'mercadopago'`, return `{ success: true, id: reservation.id }` instead of the MercadoPago `init_point`.

**Step 3: Commit**

```bash
git add src/app/api/booking/
git commit -m "feat: update booking create route to support alias/cash payment methods"
```

---

## Task 13: Update mi-cuenta to 4-tab layout

**Files:**
- Modify: `src/app/mi-cuenta/page.tsx`

**Step 1: Add new tab state and imports**

Change `activeTab` from `'packs' | 'clases' | 'historial'` to `'actividad' | 'agenda' | 'packs' | 'perfil'`.

Add imports:
```typescript
import WeeklyCalendar from '@/components/WeeklyCalendar'
import { UserProfile } from '@/data/config'
```

**Step 2: Add profile state**

```typescript
const [profile, setProfile] = useState<UserProfile | null>(null)
const [profileForm, setProfileForm] = useState({ direccion: '', obraSocial: '', telefono: '' })
const [savingProfile, setSavingProfile] = useState(false)
const [profileMessage, setProfileMessage] = useState('')
const [bedsCapacity, setBedsCapacity] = useState(4)
```

**Step 3: Fetch profile in useEffect**

Add to existing Promise.all:
```typescript
fetch('/api/user/profile').then(r => r.json()),
// in configData handling:
setBedsCapacity(configData.booking?.bedsCapacity || 4)
// in profileData handling:
if (profileData.profile) {
  setProfile(profileData.profile)
  setProfileForm({
    direccion: profileData.profile.direccion || '',
    obraSocial: profileData.profile.obraSocial || '',
    telefono: profileData.profile.telefono || '',
  })
}
```

**Step 4: Replace tab bar**

Replace existing 3-tab buttons with:
```tsx
<div className="flex gap-1 border-b border-cream-200 mb-6 overflow-x-auto">
  {([
    ['actividad', 'Mi actividad'],
    ['agenda', 'Ver agenda'],
    ['packs', 'Mis packs'],
    ['perfil', 'Mi perfil'],
  ] as const).map(([tab, label]) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
        activeTab === tab
          ? 'border-rose-500 text-rose-700'
          : 'border-transparent text-nude-500 hover:text-rose-600'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

**Step 5: Add agenda tab content**

```tsx
{activeTab === 'agenda' && (
  <div>
    <p className="text-sm text-nude-500 mb-4">
      Clases disponibles esta semana. Hacé click en un horario libre para reservar.
    </p>
    <WeeklyCalendar
      mode="user"
      recurring={recurring}
      exceptions={exceptions}
      capacity={bedsCapacity}
      userBookedSlots={upcomingClasses.map(c => ({ date: c.date, time: c.time }))}
      onSlotClick={(date, time) => {
        window.location.href = `/reservar?fecha=${date}&hora=${time}`
      }}
    />
  </div>
)}
```

**Step 6: Add perfil tab content**

```tsx
{activeTab === 'perfil' && (
  <div className="max-w-md space-y-4">
    <h3 className="font-display text-lg font-semibold text-rose-800 mb-4">Mis datos</h3>
    <div>
      <label className="block text-sm font-medium text-rose-700 mb-1">Nombre</label>
      <p className="px-4 py-3 bg-cream-50 rounded-xl text-rose-800">{user?.name}</p>
    </div>
    <div>
      <label className="block text-sm font-medium text-rose-700 mb-1">Email</label>
      <p className="px-4 py-3 bg-cream-50 rounded-xl text-nude-500">{user?.email}</p>
    </div>
    <div>
      <label className="block text-sm font-medium text-rose-700 mb-1">Teléfono</label>
      <input type="tel" value={profileForm.telefono}
        onChange={e => setProfileForm(p => ({ ...p, telefono: e.target.value }))}
        placeholder="11 1234 5678"
        className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-rose-700 mb-1">Dirección</label>
      <input type="text" value={profileForm.direccion}
        onChange={e => setProfileForm(p => ({ ...p, direccion: e.target.value }))}
        placeholder="Av. Corrientes 1234, CABA"
        className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-rose-700 mb-1">Obra social</label>
      <input type="text" value={profileForm.obraSocial}
        onChange={e => setProfileForm(p => ({ ...p, obraSocial: e.target.value }))}
        placeholder="OSDE / No tengo"
        className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
      />
    </div>
    {profileMessage && <p className="text-green-600 text-sm">{profileMessage}</p>}
    <button
      onClick={async () => {
        setSavingProfile(true)
        await fetch('/api/user/profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileForm)
        })
        setSavingProfile(false)
        setProfileMessage('Datos guardados ✓')
        setTimeout(() => setProfileMessage(''), 3000)
      }}
      disabled={savingProfile}
      className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
    >
      {savingProfile ? 'Guardando...' : 'Guardar cambios'}
    </button>
  </div>
)}
```

**Step 7: Rename existing tab content**

- Rename `activeTab === 'clases'` → show upcoming classes with payment status badges
- Rename `activeTab === 'packs'` → keep pack display
- Add `activeTab === 'actividad'` → show combined list of upcoming classes with status badges

**Step 8: Update 'actividad' tab to show payment status**

In the class list (formerly 'clases' tab), add payment status badge per class:
```tsx
{(c as any).paymentStatus === 'pending' && (
  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
    Pago pendiente
  </span>
)}
{(c as any).paymentStatus === 'verified' && (
  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
    ✓ Pagado
  </span>
)}
```

**Step 9: Commit**

```bash
git add src/app/mi-cuenta/page.tsx
git commit -m "feat: update mi-cuenta with 4-tab layout, calendar view, profile tab"
```

---

## Task 14: Admin panel — Dashboard + Pagos pendientes + Calendar tabs

**Files:**
- Modify: `src/app/admin/page.tsx` (large file — read it first with `Read` tool)

**Step 1: Read the current admin page**

Use the `Read` tool on `src/app/admin/page.tsx` to understand its current tab structure before modifying.

**Step 2: Add new API call for pending payments**

At top of admin data fetching, add:
```typescript
const [pendingPayments, setPendingPayments] = useState<any[]>([])
const [pendingCount, setPendingCount] = useState(0)

// In fetch:
fetch('/api/admin/pending-payments').then(r => r.json()).then(data => {
  setPendingPayments(data.payments || [])
  setPendingCount(data.count || 0)
})
```

**Step 3: Create `/api/admin/pending-payments/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/auth'
import { getPendingReservations, getPendingScheduledClasses } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('corpepilates_session')?.value
  if (!token || !(await validateSessionToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const [reservations, classes] = await Promise.all([
    getPendingReservations(),
    getPendingScheduledClasses(),
  ])
  const payments = [
    ...reservations.map(r => ({
      id: r.id, type: 'reservation', name: r.customerName, email: r.customerEmail,
      date: r.date, time: r.time, service: r.serviceName, price: r.servicePrice,
      method: r.paymentMethod || 'unknown', createdAt: r.createdAt,
    })),
    ...classes.map(c => ({
      id: c.id, type: 'scheduled_class', name: c.customerName, email: c.customerEmail,
      date: c.date, time: c.time, service: 'Clase de pack', price: 0,
      method: c.paymentMethod || 'unknown', createdAt: c.createdAt,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return NextResponse.json({ payments, count: payments.length })
}
```

**Step 4: Add "Pagos pendientes" tab to admin panel**

In the existing admin tab navigation, add a new tab button with count badge:
```tsx
<button
  onClick={() => setActiveTab('pagos')}
  className={`... relative`}
>
  Pagos pendientes
  {pendingCount > 0 && (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
      {pendingCount > 9 ? '9+' : pendingCount}
    </span>
  )}
</button>
```

**Step 5: Add "Pagos pendientes" tab content**

```tsx
{activeTab === 'pagos' && (
  <div>
    <h2 className="font-display text-xl font-semibold text-rose-800 mb-6">
      Pagos pendientes ({pendingCount})
    </h2>
    {pendingPayments.length === 0 ? (
      <div className="text-center py-12 text-nude-400">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No hay pagos pendientes</p>
      </div>
    ) : (
      <div className="space-y-3">
        {pendingPayments.map(p => (
          <div key={p.id} className="bg-white border border-cream-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-rose-800">{p.name}</p>
              <p className="text-sm text-nude-500">
                {new Date(p.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {p.time}hs · {p.service}
              </p>
              <p className="text-xs text-nude-400 mt-1">
                {p.method === 'alias' ? '💳 Transferencia' : p.method === 'efectivo' ? '💵 Efectivo' : '—'}
                {p.price > 0 && ` · $${p.price.toLocaleString('es-AR')}`}
              </p>
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/admin/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: p.id, type: p.type }),
                })
                if (res.ok) {
                  setPendingPayments(prev => prev.filter(x => x.id !== p.id))
                  setPendingCount(c => c - 1)
                }
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              Verificar
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

**Step 6: Add calendario admin tab**

```tsx
{activeTab === 'calendario' && (
  <div>
    <h2 className="font-display text-xl font-semibold text-rose-800 mb-6">Agenda semanal</h2>
    <WeeklyCalendar
      mode="admin"
      recurring={config.booking?.recurring || []}
      exceptions={config.booking?.exceptions || []}
      capacity={config.booking?.bedsCapacity || 4}
      slotData={adminSlotData}
    />
  </div>
)}
```

(Note: `adminSlotData` requires fetching all reservations + scheduled classes and grouping them by date. Add a helper or API call to build this object.)

**Step 7: Add alias config fields to Configuración tab**

In the site config section of admin, add below the MercadoPago toggle:
```tsx
{!config.site?.mercadopagoEnabled && (
  <div className="mt-6 p-4 bg-cream-50 rounded-xl border border-cream-200">
    <h4 className="font-medium text-rose-800 mb-4">Datos de transferencia (Alias/CVU)</h4>
    <div className="grid gap-3">
      {(['alias', 'cbu', 'banco', 'titular'] as const).map(field => (
        <div key={field}>
          <label className="block text-sm font-medium text-rose-700 mb-1 capitalize">{field}</label>
          <input
            type="text"
            value={config.site?.aliasConfig?.[field] || ''}
            onChange={e => setConfig(prev => ({
              ...prev,
              site: {
                ...prev.site,
                aliasConfig: { ...(prev.site?.aliasConfig || {}), [field]: e.target.value }
              }
            }))}
            className="w-full px-3 py-2 rounded-lg border border-cream-200 focus:border-rose-400 outline-none text-sm"
          />
        </div>
      ))}
    </div>
  </div>
)}
```

**Step 8: Add forgot password link to admin login form**

Find the admin login password input section and add below it:
```tsx
<div className="text-right mt-1">
  <button
    type="button"
    onClick={handleForgotPassword}
    className="text-xs text-nude-500 hover:text-rose-500 transition-colors"
  >
    ¿Olvidaste tu contraseña?
  </button>
</div>
```

Add handler:
```typescript
const [forgotLoading, setForgotLoading] = useState(false)
const [forgotMessage, setForgotMessage] = useState('')

const handleForgotPassword = async () => {
  setForgotLoading(true)
  const res = await fetch('/api/admin/auth/forgot-password', { method: 'POST' })
  const data = await res.json()
  setForgotLoading(false)
  if (data.success) {
    setForgotMessage(`Link enviado a ${data.email}`)
  } else {
    setForgotMessage(data.error || 'Error al enviar')
  }
}
```

**Step 9: Commit**

```bash
git add src/app/admin/page.tsx src/app/api/admin/pending-payments/route.ts
git commit -m "feat: add pagos pendientes tab, calendar admin tab, alias config, forgot password to admin"
```

---

## Task 15: Fix Hero mouse animation

**Files:**
- Modify: `src/components/Hero.tsx`

**Step 1: Add scroll fade-out effect**

Replace the static scroll indicator (lines 78-82) with:

```tsx
'use client' // add at top if not already

import { useState, useEffect } from 'react' // add to imports
// ... existing imports ...

// Inside Hero component, before return:
const [scrolled, setScrolled] = useState(false)

useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 80)
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

Replace the scroll indicator div:
```tsx
<div className={`absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce transition-opacity duration-500 ${scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
  <div className="w-6 h-10 rounded-full border-2 border-rose-400 flex items-start justify-center p-2">
    <div className="w-1.5 h-2.5 bg-rose-400 rounded-full animate-pulse" />
  </div>
</div>
```

Key changes: `bottom-8` → `bottom-12` (more clearance from content below), added scroll fade-out.

**Step 2: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "fix: increase mouse animation clearance and add scroll fade-out"
```

---

## Task 16: Add reglamento link to Footer

**Files:**
- Modify: `src/components/Footer.tsx`

**Step 1: Add reglamento state and modal**

Footer needs to become a client component to handle the modal. Add at top:
```typescript
'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
const ReglamentoModal = dynamic(() => import('./ReglamentoModal'), { ssr: false })
```

Add state inside the component:
```typescript
const [showReglamento, setShowReglamento] = useState(false)
```

**Step 2: Add the link in the "Enlaces" section**

In the `<ul>` under "Enlaces", add:
```tsx
<li>
  <button
    onClick={() => setShowReglamento(true)}
    className="text-rose-200 hover:text-white transition-colors flex items-center gap-1"
  >
    📋 Ver reglamento
  </button>
</li>
```

**Step 3: Add modal rendering**

Before the closing `</footer>` tag:
```tsx
{showReglamento && (
  <ReglamentoModal
    mode="readonly"
    onClose={() => setShowReglamento(false)}
  />
)}
```

**Step 4: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat: add reglamento link to footer"
```

---

## Task 17: Admin CMS — reglamento editor

**Files:**
- Modify: `src/app/admin/page.tsx`
- Create: `src/app/api/admin/reglamento/route.ts`

**Step 1: Create reglamento API route**

```typescript
// src/app/api/admin/reglamento/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/auth'
import { getStoredConfig, saveConfig } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const config = await getStoredConfig()
  return NextResponse.json({ reglamento: config.site?.reglamento || '' })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('corpepilates_session')?.value
  if (!token || !(await validateSessionToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { reglamento } = await req.json()
  const config = await getStoredConfig()
  config.site = { ...config.site, reglamento } as any
  await saveConfig(config)
  return NextResponse.json({ success: true })
}
```

**Step 2: Add reglamento editor to admin panel**

In admin page, add a "Reglamento" tab with:
```tsx
{activeTab === 'reglamento' && (
  <div>
    <h2 className="font-display text-xl font-semibold text-rose-800 mb-2">Reglamento del estudio</h2>
    <p className="text-nude-500 text-sm mb-6">
      Este texto se muestra a los usuarios antes de cada reserva. Usá *texto* para negritas y - para listas.
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
            body: JSON.stringify({ reglamento: reglamentoText })
          })
          // show success
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
```

**Step 3: Commit**

```bash
git add src/app/admin/page.tsx src/app/api/admin/reglamento/route.ts
git commit -m "feat: add reglamento editor with preview to admin panel"
```

---

## Task 18: Admin CMS — live preview for services and packs

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: Add preview toggle state**

```typescript
const [showPreview, setShowPreview] = useState(false)
```

**Step 2: Add preview toggle button to top of admin when in Servicios or Packs tabs**

```tsx
{(activeTab === 'servicios' || activeTab === 'packs') && (
  <button
    onClick={() => setShowPreview(!showPreview)}
    className={`fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full shadow-xl font-semibold transition-all ${
      showPreview ? 'bg-rose-500 text-white' : 'bg-white border-2 border-rose-300 text-rose-700'
    }`}
  >
    {showPreview ? '✕ Cerrar vista previa' : '👁 Vista previa'}
  </button>
)}
```

**Step 3: Wrap admin layout in split view when preview is active**

```tsx
<div className={`flex gap-6 ${showPreview ? 'h-screen overflow-hidden' : ''}`}>
  <div className={showPreview ? 'flex-1 overflow-y-auto' : 'w-full'}>
    {/* existing admin content */}
  </div>
  {showPreview && (
    <div className="flex-1 border-l border-cream-200 overflow-hidden rounded-xl">
      <div className="h-8 bg-cream-100 flex items-center px-4 text-xs text-nude-500 font-medium">
        Vista previa del sitio público
      </div>
      <iframe
        src="/"
        className="w-full h-full"
        style={{ height: 'calc(100% - 32px)' }}
      />
    </div>
  )}
</div>
```

Note: The iframe shows the current published state. After saving changes, a "Publicar y actualizar vista previa" button triggers a save + iframe refresh.

**Step 4: Add image preview on upload**

When editing a service or pack image URL, show a live `<img>` preview:
```tsx
<div className="mt-2">
  {editingService?.image && (
    <img src={editingService.image} alt="preview" className="w-full h-32 object-cover rounded-lg" />
  )}
</div>
```

**Step 5: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add CMS live preview panel and image previews to admin"
```

---

## Task 19: Final verification

**Step 1: Type check**

```bash
cd /mnt/win/Users/agusk/Desktop/Stuff/Projects/PilatesReformer && npx tsc --noEmit 2>&1
```

**Step 2: Build check**

```bash
cd /mnt/win/Users/agusk/Desktop/Stuff/Projects/PilatesReformer && npm run build 2>&1 | tail -30
```

**Step 3: Fix any build errors**

Address any TypeScript or build errors that surface.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete implementation — booking wizard, calendar, admin CMS, payments, reglamento"
```

---

## Summary of new files

| File | Purpose |
|------|---------|
| `src/components/ReglamentoModal.tsx` | Reglamento modal (booking + readonly modes) |
| `src/components/WeeklyCalendar.tsx` | Weekly calendar for user and admin |
| `src/app/admin/reset-password/page.tsx` | Admin password reset page |
| `src/app/api/user/profile/route.ts` | User profile get/save |
| `src/app/api/admin/verify-payment/route.ts` | Mark payment as verified |
| `src/app/api/admin/pending-payments/route.ts` | Get all pending payments |
| `src/app/api/admin/reglamento/route.ts` | Get/save reglamento text |
| `src/app/api/admin/auth/forgot-password/route.ts` | Send reset email |
| `src/app/api/admin/auth/reset-password/route.ts` | Apply new password |

## Summary of modified files

| File | Changes |
|------|---------|
| `src/data/config.ts` | +aliasConfig, +reglamento, +paymentStatus, +UserProfile |
| `src/lib/storage.ts` | +user profile CRUD, +pending payment queries |
| `src/lib/auth.ts` | +reset token functions, +sendResetEmail |
| `src/lib/email.ts` | +sendPaymentVerifiedEmail |
| `src/app/reservar/page.tsx` | 5-step wizard, reglamento, profile fields, alias payment |
| `src/app/mi-cuenta/page.tsx` | 4-tab layout, calendar, profile tab |
| `src/app/admin/page.tsx` | Dashboard, pagos pendientes, calendar, CMS preview, reglamento editor |
| `src/components/Hero.tsx` | Mouse animation fix |
| `src/components/Footer.tsx` | Reglamento link |
