'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Product, CartItem, Service, ServiceCartItem } from '@/types'

interface CartContextType {
  items: CartItem[]
  serviceItems: ServiceCartItem[]
  addItem: (product: Product) => boolean
  addService: (service: Service) => void
  removeItem: (productId: string) => void
  removeService: (serviceId: string) => void
  updateQuantity: (productId: string, quantity: number) => boolean
  updateServiceQuantity: (serviceId: string, quantity: number) => void
  updateServiceSlots: (serviceId: string, slots: { date: string; time: string }[]) => void
  clearCart: () => void
  total: number
  itemCount: number
  hasServices: boolean
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  stockError: string | null
  clearStockError: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceCartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [stockError, setStockError] = useState<string | null>(null)

  const checkStock = (product: Product, requestedQty: number): boolean => {
    if (!product.trackStock || product.stock === undefined) return true
    return requestedQty <= product.stock
  }

  const addItem = (product: Product): boolean => {
    const existing = items.find(item => item.product.id === product.id)
    const currentQty = existing ? existing.quantity : 0
    const newQty = currentQty + 1

    if (!checkStock(product, newQty)) {
      setStockError(`Solo hay ${product.stock} unidades disponibles de "${product.name}"`)
      setIsOpen(true)
      return false
    }

    setItems(prev => {
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setStockError(null)
    setIsOpen(true)
    return true
  }

  const addService = (service: Service) => {
    setServiceItems(prev => {
      const existing = prev.find(item => item.service.id === service.id)
      if (existing) {
        return prev.map(item =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { service, quantity: 1, selectedSlots: [] }]
    })
    setIsOpen(true)
  }

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId))
    setStockError(null)
  }

  const removeService = (serviceId: string) => {
    setServiceItems(prev => prev.filter(item => item.service.id !== serviceId))
  }

  const updateQuantity = (productId: string, quantity: number): boolean => {
    if (quantity <= 0) {
      removeItem(productId)
      return true
    }

    const item = items.find(i => i.product.id === productId)
    if (!item) return false

    if (!checkStock(item.product, quantity)) {
      setStockError(`Solo hay ${item.product.stock} unidades disponibles de "${item.product.name}"`)
      return false
    }

    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
    setStockError(null)
    return true
  }

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId)
      return
    }
    setServiceItems(prev =>
      prev.map(item =>
        item.service.id === serviceId 
          ? { ...item, quantity, selectedSlots: item.selectedSlots?.slice(0, quantity) || [] } 
          : item
      )
    )
  }

  const updateServiceSlots = (serviceId: string, slots: { date: string; time: string }[]) => {
    setServiceItems(prev =>
      prev.map(item =>
        item.service.id === serviceId
          ? { ...item, selectedSlots: slots }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    setServiceItems([])
    setStockError(null)
  }

  const clearStockError = () => setStockError(null)

  const productTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  
  const serviceTotal = serviceItems.reduce(
    (sum, item) => sum + item.service.price * item.quantity,
    0
  )

  const total = productTotal + serviceTotal

  const productCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const serviceCount = serviceItems.reduce((sum, item) => sum + item.quantity, 0)
  const itemCount = productCount + serviceCount

  const hasServices = serviceItems.length > 0

  return (
    <CartContext.Provider
      value={{
        items,
        serviceItems,
        addItem,
        addService,
        removeItem,
        removeService,
        updateQuantity,
        updateServiceQuantity,
        updateServiceSlots,
        clearCart,
        total,
        itemCount,
        hasServices,
        isOpen,
        setIsOpen,
        stockError,
        clearStockError,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
