import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { getRedis } from './redis'

const ADMIN_PASSWORD_KEY = 'corpepilates:admin_password'
const OTP_KEY = 'corpepilates:otp'
const SESSION_PREFIX = 'corpepilates:session:'
const SESSION_DURATION = 5 * 24 * 60 * 60

export async function getAdminPassword(): Promise<string | null> {
  try {
    const redis = getRedis()
    return await redis.get(ADMIN_PASSWORD_KEY)
  } catch {
    return null
  }
}

export async function setAdminPassword(password: string): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.set(ADMIN_PASSWORD_KEY, password)
    return true
  } catch {
    return false
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const envPassword = process.env.ADMIN_PASSWORD || 'corpepilates2024'
  if (password === envPassword) return true
  
  const dbPassword = await getAdminPassword()
  if (dbPassword && password === dbPassword) return true
  
  return false
}

export async function generateOTP(): Promise<string> {
  const redis = getRedis()
  const otp = Math.random().toString().slice(2, 8)
  await redis.setex(OTP_KEY, 600, otp)
  return otp
}

export async function verifyOTP(otp: string, deleteAfter: boolean = false): Promise<boolean> {
  try {
    const redis = getRedis()
    const storedOTP = await redis.get(OTP_KEY)
    const storedStr = String(storedOTP || '')
    const inputStr = String(otp || '').trim()
    
    if (storedStr && storedStr === inputStr) {
      if (deleteAfter) {
        await redis.del(OTP_KEY)
      }
      return true
    }
    return false
  } catch (error) {
    console.error('Error verificando OTP:', error)
    return false
  }
}

export async function deleteOTP(): Promise<void> {
  try {
    const redis = getRedis()
    await redis.del(OTP_KEY)
  } catch {}
}

export async function createSessionToken(): Promise<string> {
  const redis = getRedis()
  const token = crypto.randomBytes(32).toString('hex')
  await redis.setex(SESSION_PREFIX + token, SESSION_DURATION, JSON.stringify({ createdAt: Date.now() }))
  return token
}

export async function validateSessionToken(token: string): Promise<boolean> {
  if (!token) return false
  try {
    const redis = getRedis()
    const session = await redis.get(SESSION_PREFIX + token)
    return !!session
  } catch {
    return false
  }
}

export async function deleteSessionToken(token: string): Promise<void> {
  try {
    const redis = getRedis()
    await redis.del(SESSION_PREFIX + token)
  } catch {}
}

export async function sendOTPEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
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
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
    
    await transporter.sendMail({
      from: `Corpe Pilates <${smtpUser}>`,
      to: email,
      subject: 'Código de verificación - Corpe Pilates Admin',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e85d5d; text-align: center;">Corpe Pilates</h2>
          <p style="text-align: center; color: #666;">Tu código de verificación es:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px;">
            Este código expira en 10 minutos.<br>
            Si no solicitaste este código, ignorá este email.
          </p>
        </div>
      `,
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error sending OTP email:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}
