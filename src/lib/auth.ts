import { createClient } from '@vercel/kv'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const ADMIN_PASSWORD_KEY = 'corpepilates:admin_password'
const OTP_KEY = 'corpepilates:otp'
const SESSION_PREFIX = 'corpepilates:session:'
const SESSION_DURATION = 5 * 24 * 60 * 60

function getKV() {
  return createClient({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
    cache: 'no-store',
    automaticDeserialization: true,
  })
}

export async function getAdminPassword(): Promise<string | null> {
  try {
    return await getKV().get<string>(ADMIN_PASSWORD_KEY)
  } catch {
    return null
  }
}

export async function setAdminPassword(password: string): Promise<boolean> {
  try {
    await getKV().set(ADMIN_PASSWORD_KEY, password)
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
  const otp = Math.random().toString().slice(2, 8)
  await getKV().set(OTP_KEY, otp, { ex: 600 })
  return otp
}

export async function verifyOTP(otp: string, deleteAfter: boolean = false): Promise<boolean> {
  try {
    const storedOTP = await getKV().get(OTP_KEY)
    const storedStr = String(storedOTP || '')
    const inputStr = String(otp || '').trim()
    
    if (storedStr && storedStr === inputStr) {
      if (deleteAfter) {
        await getKV().del(OTP_KEY)
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
    await getKV().del(OTP_KEY)
  } catch {}
}

export async function createSessionToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  await getKV().set(SESSION_PREFIX + token, { createdAt: Date.now() }, { ex: SESSION_DURATION })
  return token
}

export async function validateSessionToken(token: string): Promise<boolean> {
  if (!token) return false
  try {
    const session = await getKV().get(SESSION_PREFIX + token)
    return !!session
  } catch {
    return false
  }
}

export async function deleteSessionToken(token: string): Promise<void> {
  try {
    await getKV().del(SESSION_PREFIX + token)
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
