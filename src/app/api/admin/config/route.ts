import { NextRequest, NextResponse } from 'next/server'
import { getStoredConfig, saveConfig } from '@/lib/storage'
import { verifyPassword, validateSessionToken } from '@/lib/auth'
import type { FullConfig } from '@/data/config'

export const dynamic = 'force-dynamic'

const SESSION_COOKIE_NAME = 'corpepilates_session'

export async function GET() {
  const config = await getStoredConfig()
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, config } = body as { password?: string; config: FullConfig }
    
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const isSessionValid = sessionToken ? await validateSessionToken(sessionToken) : false
    const isPasswordValid = password ? await verifyPassword(password) : false
    
    if (!isSessionValid && !isPasswordValid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const success = await saveConfig(config)

    if (success) {
      return NextResponse.json({ success: true, message: 'Configuración guardada' })
    } else {
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error saving config:', error)
    return NextResponse.json({ error: 'Error al guardar la configuración' }, { status: 500 })
  }
}
