import { NextRequest, NextResponse } from 'next/server'
import { getFeeStatus, setFeeEnabled, setFeePercentage, setDevelopmentPaid } from '@/lib/fee'
import { validateSessionToken } from '@/lib/auth'

const SESSION_COOKIE_NAME = 'corpepilates_session'

export async function GET() {
  const status = await getFeeStatus()
  return NextResponse.json(status)
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const isSessionValid = sessionToken ? await validateSessionToken(sessionToken) : false
  
  if (!isSessionValid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { enabled, percentage, developmentPaid } = body

    if (typeof developmentPaid === 'boolean') {
      await setDevelopmentPaid(developmentPaid)
    }

    if (typeof enabled === 'boolean') {
      await setFeeEnabled(enabled)
    }

    if (typeof percentage === 'number') {
      await setFeePercentage(percentage)
    }

    const status = await getFeeStatus()
    return NextResponse.json({ success: true, ...status })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
