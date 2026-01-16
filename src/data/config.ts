export interface SiteConfig {
  siteName: string
  tagline: string
  instagram: string
  whatsapp: string
  email: string
  location?: string
  deliveryMode?: 'pickup' | 'shipping' | 'both'
  productsEnabled?: boolean
  packsEnabled?: boolean
  mercadopagoEnabled?: boolean
  singleClassEnabled?: boolean
}

export interface ProductConfig {
  id: string
  name: string
  description: string
  price: number
  category: 'accesorios' | 'ropa' | 'equipamiento' | 'suplementos'
  image: string
  featured?: boolean
  paused?: boolean
  stock?: number
  trackStock?: boolean
}

export interface TimeSlot {
  start: string
  end: string
}

export interface RecurringSchedule {
  dayOfWeek: number
  slots: TimeSlot[]
}

export interface DateException {
  date: string
  slots: TimeSlot[]
  isBlocked: boolean
}

export interface ServiceConfig {
  id: string
  name: string
  description: string
  price: number
  duration: string
  image: string
  paused?: boolean
  bookable?: boolean
  durationMinutes: number
}

export interface BookingConfig {
  enabled: boolean
  bedsCapacity?: number
  recurring: RecurringSchedule[]
  exceptions: DateException[]
}

export interface Reservation {
  id: string
  serviceId: string
  serviceName: string
  servicePrice: number
  date: string
  time: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAge?: string
  customerHealthConditions?: string
  paymentId?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: number
}

export interface PackConfig {
  id: string
  name: string
  description: string
  classCount: number
  price: number
  validityDays: number
  image: string
  paused?: boolean
}

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  googleId: string
  createdAt: number
}

export interface UserPack {
  id: string
  packId: string
  packName: string
  userId: string
  classesRemaining: number
  classesUsed: number
  expiresAt: number
  purchasedAt: number
  paymentId?: string
  status: 'active' | 'expired' | 'exhausted'
}

export interface ScheduledClass {
  id: string
  oderId?: string
  userId?: string
  userPackId?: string
  date: string
  time: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'absent'
  createdAt: number
}

export interface CartItem {
  type: 'product' | 'service'
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  slots?: { date: string; time: string }[]
  durationMinutes?: number
}

export interface FullConfig {
  site: SiteConfig
  products: ProductConfig[]
  services: ServiceConfig[]
  packs: PackConfig[]
  booking?: BookingConfig
}

const defaultRecurring: RecurringSchedule[] = [
  { dayOfWeek: 2, slots: [{ start: '18:00', end: '19:00' }] },
  { dayOfWeek: 5, slots: [{ start: '18:00', end: '19:00' }] },
]

export const defaultConfig: FullConfig = {
  site: {
    siteName: 'Corpe Pilates',
    tagline: 'Pilates Reformer para todos',
    instagram: 'https://instagram.com/corpepilates',
    whatsapp: '5491161515110',
    email: 'corpepilates@gmail.com',
    location: 'Avenida Segurola 386, Floresta, CABA',
    deliveryMode: 'pickup',
    productsEnabled: false,
    packsEnabled: true,
    mercadopagoEnabled: true,
    singleClassEnabled: true,
  },
  booking: {
    enabled: true,
    bedsCapacity: 4,
    recurring: defaultRecurring,
    exceptions: [],
  },
  products: [],
  packs: [
    {
      id: 'pack-4',
      name: 'Pack 4 Clases',
      description: 'Ideal para probar. Comprá 4 clases y agendá cuando quieras dentro de los 30 días.',
      classCount: 4,
      price: 28000,
      validityDays: 30,
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
    },
    {
      id: 'pack-8',
      name: 'Pack 8 Clases',
      description: 'El más popular. 8 clases para usar en 45 días con total flexibilidad de horarios.',
      classCount: 8,
      price: 52000,
      validityDays: 45,
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
    },
    {
      id: 'pack-12',
      name: 'Pack 12 Clases',
      description: 'Máximo ahorro. 12 clases para usar en 60 días. Ideal para entrenar regularmente.',
      classCount: 12,
      price: 72000,
      validityDays: 60,
      image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=400&fit=crop',
    },
  ],
  services: [
    {
      id: 'clase-suelta',
      name: 'Clase Suelta',
      description: 'Una clase de Pilates Reformer. Ideal si querés probar o venir de manera esporádica sin compromiso.',
      price: 9000,
      duration: '60 min',
      durationMinutes: 60,
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
    },
    {
      id: 'clase-duo',
      name: 'Clase Dúo',
      description: 'Clase para 2 personas en reformers individuales. Ideal para venir con una amiga, pareja o familiar.',
      price: 14000,
      duration: '60 min',
      durationMinutes: 60,
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
    },
    {
      id: 'clase-privada',
      name: 'Clase Privada',
      description: 'Sesión personalizada uno a uno. Atención exclusiva para trabajar tus objetivos específicos.',
      price: 18000,
      duration: '60 min',
      durationMinutes: 60,
      image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=400&fit=crop',
    },
  ],
}

export const categories = [
  { id: 'accesorios', name: 'Accesorios', icon: '🎯' },
  { id: 'ropa', name: 'Ropa', icon: '👕' },
  { id: 'equipamiento', name: 'Equipamiento', icon: '🏋️' },
  { id: 'suplementos', name: 'Suplementos', icon: '💊' },
]

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export const DAYS_OF_WEEK = [
  { id: 0, name: 'Domingo', short: 'Dom' },
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
]

export function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function addMinutes(time: string, mins: number): string {
  return formatTime(parseTime(time) + mins)
}
