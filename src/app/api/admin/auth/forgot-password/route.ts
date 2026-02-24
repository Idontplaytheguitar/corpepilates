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
