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
