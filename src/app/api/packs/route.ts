import { NextResponse } from 'next/server'
import { getStoredConfig } from '@/lib/storage'
import type { PackConfig } from '@/data/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await getStoredConfig()
    const packs = (config.packs || []).filter((p: PackConfig) => !p.paused)
    
    return NextResponse.json({ packs })
  } catch (error) {
    console.error('Error fetching packs:', error)
    return NextResponse.json({ error: 'Error al obtener packs' }, { status: 500 })
  }
}
