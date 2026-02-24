'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
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
          <Link href="/admin" className="px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors inline-block">
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
