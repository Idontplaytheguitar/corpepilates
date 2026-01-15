import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, generateOTP, sendOTPEmail, verifyOTP, setAdminPassword, getAdminPassword, deleteOTP, createSessionToken, validateSessionToken, deleteSessionToken } from '@/lib/auth'
import { getStoredConfig } from '@/lib/storage'

const SESSION_COOKIE_NAME = 'corpepilates_session'
const SESSION_MAX_AGE = 5 * 24 * 60 * 60 // 5 días en segundos

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) {
    return NextResponse.json({ authenticated: false })
  }
  
  const valid = await validateSessionToken(token)
  return NextResponse.json({ authenticated: valid })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, password, otp, newPassword } = body

  if (action === 'login') {
    const valid = await verifyPassword(password)
    if (valid) {
      const token = await createSessionToken()
      const response = NextResponse.json({ success: true })
      
      response.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      })
      
      return response
    }
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  if (action === 'logout') {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (token) {
      await deleteSessionToken(token)
    }
    
    const response = NextResponse.json({ success: true })
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  if (action === 'check') {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ authenticated: false })
    }
    const valid = await validateSessionToken(token)
    return NextResponse.json({ authenticated: valid })
  }

  if (action === 'request_otp') {
    const config = await getStoredConfig()
    const email = config.site.email

    if (!email) {
      return NextResponse.json({ error: 'No hay email configurado. Guardá primero un email de contacto.' }, { status: 400 })
    }

    const otpCode = await generateOTP()
    const result = await sendOTPEmail(email, otpCode)

    if (result.success) {
      const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      return NextResponse.json({ success: true, email: maskedEmail })
    }
    
    return NextResponse.json({ error: result.error || 'Error al enviar el código' }, { status: 500 })
  }

  if (action === 'verify_otp') {
    const valid = await verifyOTP(otp, false)
    if (valid) {
      return NextResponse.json({ success: true, verified: true })
    }
    return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
  }

  if (action === 'change_password') {
    const otpValid = await verifyOTP(otp, false)
    if (!otpValid) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const success = await setAdminPassword(newPassword)
    if (success) {
      await deleteOTP()
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Error al guardar la contraseña' }, { status: 500 })
  }

  if (action === 'has_custom_password') {
    const customPassword = await getAdminPassword()
    return NextResponse.json({ hasCustomPassword: !!customPassword })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
