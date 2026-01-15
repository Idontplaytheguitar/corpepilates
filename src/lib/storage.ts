import { FullConfig, defaultConfig, Reservation } from '@/data/config'
import { getRedis } from './redis'

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

export async function getStoredConfig(): Promise<FullConfig> {
  try {
    const redis = getRedis()
    const data = await redis.get(CONFIG_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return defaultConfig
  } catch (error) {
    console.error('Error getting config:', error)
    return defaultConfig
  }
}

export async function saveConfig(config: FullConfig): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.set(CONFIG_KEY, JSON.stringify(config))
    return true
  } catch (error) {
    console.error('Error saving config:', error)
    return false
  }
}

export async function getReservations(): Promise<Reservation[]> {
  try {
    const redis = getRedis()
    const data = await redis.get(RESERVATIONS_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return []
  } catch {
    return []
  }
}

export async function saveReservation(reservation: Reservation): Promise<boolean> {
  try {
    const redis = getRedis()
    const reservations = await getReservations()
    const existingIndex = reservations.findIndex(r => r.id === reservation.id)
    if (existingIndex >= 0) {
      reservations[existingIndex] = reservation
    } else {
      reservations.push(reservation)
    }
    await redis.set(RESERVATIONS_KEY, JSON.stringify(reservations))
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
    const redis = getRedis()
    const data = await redis.get(ORDERS_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return []
  } catch {
    return []
  }
}

export async function saveOrder(order: Order): Promise<boolean> {
  try {
    const redis = getRedis()
    const orders = await getOrders()
    const existingIndex = orders.findIndex(o => o.id === order.id)
    if (existingIndex >= 0) {
      orders[existingIndex] = order
    } else {
      orders.push(order)
    }
    await redis.set(ORDERS_KEY, JSON.stringify(orders))
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
