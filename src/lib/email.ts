import nodemailer from 'nodemailer'
import { getStoredConfig } from './storage'

interface SendEmailResult {
  success: boolean
  error?: string
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '465')

  if (!smtpUser || !smtpPass) {
    console.log('SMTP not configured, skipping email to:', to)
    return { success: false, error: 'Email no configurado en el servidor' }
  }

  try {
    const config = await getStoredConfig()
    const siteName = config.site?.siteName || 'Corpe Pilates'

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
      from: `${siteName} <${smtpUser}>`,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function sendPaymentVerifiedEmail(
  to: string,
  name: string,
  date: string,
  time: string,
  serviceName: string
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '465')
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
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
