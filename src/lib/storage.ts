import { FullConfig, defaultConfig, Reservation } from '@/data/config'
import { createClient } from '@vercel/kv'

const CONFIG_KEY = 'corpepilates:config'
const RESERVATIONS_KEY = 'corpepilates:reservations'
const ORDERS_KEY = 'corpepilates:orders'

export interface OrderItem {
  id?: string
  name: string
  quantity: number
  price: number
}

export interface OrderSlot {
  serviceId?: string
  serviceName?: string
  date: string
  time: string
  status?: 'pending' | 'completed' | 'absent'
}

export interface Order {
  id: string
  items: OrderItem[]
  serviceItems: OrderItem[]
  selectedSlots: OrderSlot[]
  customer: { name: string; email: string; phone: string }
  total: number
  status: 'pending' | 'confirmed' | 'cancelled'
  deliveryStatus?: 'pending' | 'delivered'
  createdAt: number
}

let kvClient: ReturnType<typeof createClient> | null = null

function getKv() {
  if (kvClient) return kvClient

  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    throw new Error('Missing KV_REST_API_URL / KV_REST_API_TOKEN')
  }

  kvClient = createClient({
    url,
    token,
    cache: 'no-store',
  })

  return kvClient
}

export async function getStoredConfig(): Promise<FullConfig> {
  try {
    const config = await getKv().get<FullConfig>(CONFIG_KEY)
    return config || defaultConfig
  } catch (error) {
    return defaultConfig
  }
}

export async function saveConfig(config: FullConfig): Promise<boolean> {
  try {
    await getKv().set(CONFIG_KEY, config)
    return true
  } catch (error) {
    console.error('Error saving config:', error)
    return false
  }
}

export async function getReservations(): Promise<Reservation[]> {
  try {
    const reservations = await getKv().get<Reservation[]>(RESERVATIONS_KEY)
    return reservations || []
  } catch {
    return []
  }
}

export async function saveReservation(reservation: Reservation): Promise<boolean> {
  try {
    const reservations = await getReservations()
    const existingIndex = reservations.findIndex(r => r.id === reservation.id)
    if (existingIndex >= 0) {
      reservations[existingIndex] = reservation
    } else {
      reservations.push(reservation)
    }
    await getKv().set(RESERVATIONS_KEY, reservations)
    return true
  } catch (error) {
    console.error('Error saving reservation:', error)
    return false
  }
}

export async function getReservationsByDate(date: string): Promise<Reservation[]> {
  const reservations = await getReservations()
  return reservations.filter(r => r.date === date && r.status !== 'cancelled')
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  const reservations = await getReservations()
  return reservations.find(r => r.id === id) || null
}

export async function getOrders(): Promise<Order[]> {
  try {
    const orders = await getKv().get<Order[]>(ORDERS_KEY)
    return orders || []
  } catch {
    return []
  }
}

export async function saveOrder(order: Order): Promise<boolean> {
  try {
    const orders = await getOrders()
    const existingIndex = orders.findIndex(o => o.id === order.id)
    if (existingIndex >= 0) {
      orders[existingIndex] = order
    } else {
      orders.push(order)
    }
    await getKv().set(ORDERS_KEY, orders)
    return true
  } catch (error) {
    console.error('Error saving order:', error)
    return false
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders()
  return orders.find(o => o.id === id) || null
}
