import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/storage'
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
