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
