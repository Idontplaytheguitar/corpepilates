'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, Settings } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import Cart from './Cart'

interface HeaderProps {
  siteName?: string
  tagline?: string
  productsEnabled?: boolean
}

export default function Header({ siteName = 'Corpe Pilates', tagline = 'Pilates Reformer', productsEnabled = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { itemCount, setIsOpen } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'check' }),
    })
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.authenticated === true)
      })
      .catch(() => setIsAdmin(false))
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          mobileMenuOpen 
            ? 'bg-white shadow-lg py-3' 
            : isScrolled 
              ? 'glass-strong shadow-lg py-3' 
              : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <a href="/" className="group">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-gradient">
                {siteName}
              </h1>
              <span className="block text-xs text-nude-500 tracking-widest uppercase">
                {tagline}
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              <NavLink href="/#servicios">Planes</NavLink>
              {productsEnabled && <NavLink href="/#productos">Productos</NavLink>}
              <NavLink href="/#sobre-mi">Sobre Nosotros</NavLink>
              <NavLink href="/#contacto">Contacto</NavLink>
            </nav>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="p-2 rounded-full hover:bg-rose-100 transition-colors"
                  title="Panel de administración"
                >
                  <Settings className="w-5 h-5 text-rose-600" />
                </Link>
              )}
              
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 rounded-full hover:bg-rose-100 transition-colors"
                aria-label="Carrito de compras"
              >
                <ShoppingBag className="w-6 h-6 text-rose-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-rose-100 transition-colors"
                aria-label="Menú"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-rose-600" />
                ) : (
                  <Menu className="w-6 h-6 text-rose-600" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3 animate-fade-in">
              <MobileNavLink href="/#servicios" onClick={() => setMobileMenuOpen(false)}>
                Planes
              </MobileNavLink>
              {productsEnabled && (
                <MobileNavLink href="/#productos" onClick={() => setMobileMenuOpen(false)}>
                  Productos
                </MobileNavLink>
              )}
              <MobileNavLink href="/#sobre-mi" onClick={() => setMobileMenuOpen(false)}>
                Sobre Nosotros
              </MobileNavLink>
              <MobileNavLink href="/#contacto" onClick={() => setMobileMenuOpen(false)}>
                Contacto
              </MobileNavLink>
              {isAdmin && (
                <MobileNavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  ⚙️ Administración
                </MobileNavLink>
              )}
            </nav>
          )}
        </div>
      </header>
      <Cart />
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith('/#') && typeof window !== 'undefined' && window.location.pathname === '/') {
      e.preventDefault()
      const hash = href.substring(1)
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="text-rose-800 hover:text-rose-500 transition-colors font-medium relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-400 transition-all group-hover:w-full" />
    </a>
  )
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith('/#') && typeof window !== 'undefined' && window.location.pathname === '/') {
      e.preventDefault()
      const hash = href.substring(1)
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    onClick()
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="text-rose-800 hover:text-rose-500 transition-colors font-medium py-2 px-4 rounded-lg hover:bg-rose-50"
    >
      {children}
    </a>
  )
}
