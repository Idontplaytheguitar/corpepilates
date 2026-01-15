'use client'

import { useState } from 'react'
import { categories } from '@/data/config'
import ProductCard from './ProductCard'
import type { ProductConfig } from '@/data/config'

interface ProductsSectionProps {
  products: ProductConfig[]
  whatsapp?: string
  email?: string
}

export default function ProductsSection({ products, whatsapp, email }: ProductsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const activeProducts = products.filter(p => !p.paused)
  
  const sortedProducts = [...activeProducts].sort((a, b) => {
    const aOutOfStock = a.trackStock && a.stock !== undefined && a.stock <= 0
    const bOutOfStock = b.trackStock && b.stock !== undefined && b.stock <= 0
    if (aOutOfStock && !bOutOfStock) return 1
    if (!aOutOfStock && bOutOfStock) return -1
    return 0
  })
  
  const filteredProducts = activeCategory
    ? sortedProducts.filter(p => p.category === activeCategory)
    : sortedProducts

  return (
    <section id="productos" className="py-24 bg-gradient-to-b from-transparent to-cream-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-rose-500 text-sm font-medium tracking-widest uppercase">
            Nuestro Catálogo
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-rose-800 mt-2">
            Productos Artesanales
          </h2>
          <p className="text-nude-500 mt-4 max-w-2xl mx-auto">
            Cada producto está hecho a mano con ingredientes naturales seleccionados.
            Cuidamos tu piel como si fuera la nuestra.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2.5 rounded-full font-medium transition-all ${
              !activeCategory
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard product={product} whatsapp={whatsapp} email={email} />
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-nude-400">
            No hay productos en esta categoría.
          </div>
        )}
      </div>
    </section>
  )
}
