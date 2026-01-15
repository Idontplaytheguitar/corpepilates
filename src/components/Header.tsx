'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, Settings, User, LogOut, Calendar, Package } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useUser } from '@/context/UserContext'
import Cart from './Cart'

interface HeaderProps {
  siteName?: string
  tagline?: string
  productsEnabled?: boolean
  packsEnabled?: boolean
}

export default function Header({ siteName = 'Corpe Pilates', tagline = 'Pilates Reformer', productsEnabled = false, packsEnabled = true }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { itemCount, setIsOpen } = useCart()
  const { user, loading: userLoading, login, logout } = useUser()

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
              {packsEnabled && <NavLink href="/#packs">Packs</NavLink>}
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
              
              {packsEnabled && !userLoading && (
                user ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-full hover:bg-rose-100 transition-colors"
                    >
                      {user.picture ? (
                        <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-rose-600" />
                        </div>
                      )}
                    </button>
                    
                    {userMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-cream-200 py-2 z-50">
                          <div className="px-4 py-2 border-b border-cream-100">
                            <p className="font-medium text-rose-800 truncate">{user.name}</p>
                            <p className="text-xs text-nude-500 truncate">{user.email}</p>
                          </div>
                          <Link
                            href="/mi-cuenta"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-rose-50 text-rose-800"
                          >
                            <Calendar className="w-4 h-4" />
                            Mis Clases
                          </Link>
                          <Link
                            href="/packs"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-rose-50 text-rose-800"
                          >
                            <Package className="w-4 h-4" />
                            Comprar Pack
                          </Link>
                          <button
                            onClick={() => {
                              logout()
                              setUserMenuOpen(false)
                            }}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-rose-50 text-rose-800 w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesion
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => login()}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Ingresar
                  </button>
                )
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
              {packsEnabled && (
                <MobileNavLink href="/#packs" onClick={() => setMobileMenuOpen(false)}>
                  Packs de Clases
                </MobileNavLink>
              )}
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
              {packsEnabled && user && (
                <MobileNavLink href="/mi-cuenta" onClick={() => setMobileMenuOpen(false)}>
                  Mis Clases
                </MobileNavLink>
              )}
              {packsEnabled && !user && !userLoading && (
                <button
                  onClick={() => { login(); setMobileMenuOpen(false) }}
                  className="text-rose-800 hover:text-rose-500 transition-colors font-medium py-2 px-4 rounded-lg hover:bg-rose-50 text-left"
                >
                  Ingresar
                </button>
              )}
              {isAdmin && (
                <MobileNavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  Administracion
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

function smoothScrollTo(targetId: string) {
  const element = document.querySelector(targetId)
  if (!element) return
  
  const headerOffset = 80
  const elementPosition = element.getBoundingClientRect().top
  const startPosition = window.pageYOffset
  const targetPosition = startPosition + elementPosition - headerOffset
  const distance = targetPosition - startPosition
  const duration = 800
  let startTime: number | null = null

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    const easeInOutCubic = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2
    
    window.scrollTo(0, startPosition + distance * easeInOutCubic)
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation)
    }
  }
  
  requestAnimationFrame(animation)
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith('/#') && typeof window !== 'undefined') {
      if (window.location.pathname === '/') {
        e.preventDefault()
        const hash = href.substring(1)
        smoothScrollTo(hash)
        window.history.pushState(null, '', hash)
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
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-400 transition-all duration-300 ease-out group-hover:w-full" />
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
    if (href.startsWith('/#') && typeof window !== 'undefined') {
      if (window.location.pathname === '/') {
        e.preventDefault()
        const hash = href.substring(1)
        smoothScrollTo(hash)
        window.history.pushState(null, '', hash)
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
