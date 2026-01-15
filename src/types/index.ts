export interface Product {
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

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: string
  durationMinutes?: number
  image: string
  bookable?: boolean
  paused?: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface ServiceCartItem {
  service: Service
  quantity: number
  selectedSlots?: { date: string; time: string }[]
}

export interface CheckoutData {
  items: CartItem[]
  serviceItems?: ServiceCartItem[]
  customer: {
    name: string
    email: string
    phone: string
  }
}
