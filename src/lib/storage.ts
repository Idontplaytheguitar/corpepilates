import { FullConfig, defaultConfig, Reservation, User, UserPack, ScheduledClass } from '@/data/config'
import { getRedis } from './redis'

const CONFIG_KEY = 'corpepilates:config'
const RESERVATIONS_KEY = 'corpepilates:reservations'
const ORDERS_KEY = 'corpepilates:orders'
const USERS_KEY = 'corpepilates:users'
const USER_PACKS_KEY = 'corpepilates:user_packs'
const SCHEDULED_CLASSES_KEY = 'corpepilates:scheduled_classes'
const USER_SESSIONS_PREFIX = 'corpepilates:user_session:'

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
  customer: { name: string; email: string; phone: string; age?: string; healthConditions?: string }
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

export async function getUsers(): Promise<User[]> {
  try {
    const redis = getRedis()
    const data = await redis.get(USERS_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return []
  } catch {
    return []
  }
}

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.googleId === googleId) || null
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.id === id) || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.email === email) || null
}

export async function saveUser(user: User): Promise<boolean> {
  try {
    const redis = getRedis()
    const users = await getUsers()
    const existingIndex = users.findIndex(u => u.id === user.id)
    if (existingIndex >= 0) {
      users[existingIndex] = user
    } else {
      users.push(user)
    }
    await redis.set(USERS_KEY, JSON.stringify(users))
    return true
  } catch (error) {
    console.error('Error saving user:', error)
    return false
  }
}

export async function getUserPacks(): Promise<UserPack[]> {
  try {
    const redis = getRedis()
    const data = await redis.get(USER_PACKS_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return []
  } catch {
    return []
  }
}

export async function getUserPacksByUserId(userId: string): Promise<UserPack[]> {
  const packs = await getUserPacks()
  return packs.filter(p => p.userId === userId)
}

export async function getActiveUserPacksByUserId(userId: string): Promise<UserPack[]> {
  const packs = await getUserPacksByUserId(userId)
  const now = Date.now()
  return packs.filter(p => p.status === 'active' && p.classesRemaining > 0 && p.expiresAt > now)
}

export async function getUserPackById(id: string): Promise<UserPack | null> {
  const packs = await getUserPacks()
  return packs.find(p => p.id === id) || null
}

export async function saveUserPack(pack: UserPack): Promise<boolean> {
  try {
    const redis = getRedis()
    const packs = await getUserPacks()
    const existingIndex = packs.findIndex(p => p.id === pack.id)
    if (existingIndex >= 0) {
      packs[existingIndex] = pack
    } else {
      packs.push(pack)
    }
    await redis.set(USER_PACKS_KEY, JSON.stringify(packs))
    return true
  } catch (error) {
    console.error('Error saving user pack:', error)
    return false
  }
}

export async function getScheduledClasses(): Promise<ScheduledClass[]> {
  try {
    const redis = getRedis()
    const data = await redis.get(SCHEDULED_CLASSES_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return []
  } catch {
    return []
  }
}

export async function getScheduledClassesByDate(date: string): Promise<ScheduledClass[]> {
  const classes = await getScheduledClasses()
  return classes.filter(c => c.date === date && c.status !== 'cancelled')
}

export async function getScheduledClassesByUserId(userId: string): Promise<ScheduledClass[]> {
  const classes = await getScheduledClasses()
  return classes.filter(c => c.userId === userId)
}

export async function getScheduledClassById(id: string): Promise<ScheduledClass | null> {
  const classes = await getScheduledClasses()
  return classes.find(c => c.id === id) || null
}

export async function saveScheduledClass(scheduledClass: ScheduledClass): Promise<boolean> {
  try {
    const redis = getRedis()
    const classes = await getScheduledClasses()
    const existingIndex = classes.findIndex(c => c.id === scheduledClass.id)
    if (existingIndex >= 0) {
      classes[existingIndex] = scheduledClass
    } else {
      classes.push(scheduledClass)
    }
    await redis.set(SCHEDULED_CLASSES_KEY, JSON.stringify(classes))
    return true
  } catch (error) {
    console.error('Error saving scheduled class:', error)
    return false
  }
}

export async function getSlotOccupancy(date: string, time: string): Promise<number> {
  const reservations = await getReservationsByDate(date)
  const scheduledClasses = await getScheduledClassesByDate(date)
  const orders = await getOrders()
  
  const reservationCount = reservations.filter(r => r.time === time && r.status === 'confirmed').length
  const scheduledCount = scheduledClasses.filter(c => c.time === time && c.status === 'scheduled').length
  const orderSlotsCount = orders.flatMap(o => 
    o.selectedSlots.filter(s => s.date === date && s.time === time && s.status !== 'absent' && s.status !== 'completed')
  ).length
  
  return reservationCount + scheduledCount + orderSlotsCount
}

export async function createUserSession(userId: string): Promise<string> {
  const redis = getRedis()
  const token = crypto.randomUUID()
  const sessionData = JSON.stringify({ userId, createdAt: Date.now() })
  await redis.setex(USER_SESSIONS_PREFIX + token, 30 * 24 * 60 * 60, sessionData)
  return token
}

export async function getUserSession(token: string): Promise<{ userId: string } | null> {
  if (!token) return null
  try {
    const redis = getRedis()
    const data = await redis.get(USER_SESSIONS_PREFIX + token)
    if (data) {
      return JSON.parse(data)
    }
    return null
  } catch {
    return null
  }
}

export async function deleteUserSession(token: string): Promise<void> {
  try {
    const redis = getRedis()
    await redis.del(USER_SESSIONS_PREFIX + token)
  } catch {}
}
