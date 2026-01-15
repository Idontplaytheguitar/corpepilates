import { NextRequest, NextResponse } from 'next/server'
import { getOrders, saveOrder, getOrderById } from '@/lib/storage'

export async function GET() {
  try {
    const orders = await getOrders()
    const sortedOrders = orders.sort((a, b) => b.createdAt - a.createdAt)
    return NextResponse.json({ orders: sortedOrders })
  } catch (error) {
    console.error('Error getting orders:', error)
    return NextResponse.json({ orders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, deliveryStatus, slotIndex, slotCompleted } = body

    if (!orderId) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 })
    }

    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (deliveryStatus !== undefined) {
      order.deliveryStatus = deliveryStatus
    }

    if (slotIndex !== undefined && order.selectedSlots[slotIndex]) {
      order.selectedSlots[slotIndex].status = body.slotStatus || (slotCompleted ? 'completed' : 'pending')
    }

    await saveOrder(order)

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 })
  }
}
