import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/auth'
import { getStoredConfig, saveConfig } from '@/lib/storage'

export async function GET() {
  const config = await getStoredConfig()
  return NextResponse.json({ reglamento: (config.site as any)?.reglamento || '' })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('corpepilates_session')?.value
  if (!token || !(await validateSessionToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { reglamento } = await req.json()
  const config = await getStoredConfig()
  ;(config.site as any).reglamento = reglamento
  await saveConfig(config)
  return NextResponse.json({ success: true })
}
