import { NextRequest, NextResponse } from 'next/server'
import { getStoredConfig, saveConfig } from '@/lib/storage'

interface StockUpdateItem {
  productId: string
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as { items: StockUpdateItem[] }

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, message: 'No items to update' })
    }

    const config = await getStoredConfig()
    let updated = false

    for (const item of items) {
      const productIndex = config.products.findIndex(p => p.id === item.productId)
      if (productIndex !== -1) {
        const product = config.products[productIndex]
        if (product.trackStock && product.stock !== undefined) {
          const newStock = Math.max(0, product.stock - item.quantity)
          config.products[productIndex] = { ...product, stock: newStock }
          updated = true
        }
      }
    }

    if (updated) {
      await saveConfig(config)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el stock' },
      { status: 500 }
    )
  }
}
