'use client'

import { useState, useEffect } from 'react'
import { Activity, Heart, Zap, ArrowRight } from 'lucide-react'
import type { HeroContent } from '@/data/config'

const defaultHero: HeroContent = {
  eyebrow: 'Pilates Reformer para todos',
  description: 'Fortalecé tu core, cuidá tu columna y transformá tu cuerpo. Clases personalizadas con equipos profesionales Reformer.',
  ctaPrimary: 'Ver Planes',
  ctaSecondary: 'Reservar Clase',
  featurePills: ['Cuidá tu columna', 'Fortalecé tu core', 'Ganá fuerza y flexibilidad'],
}

const pillIcons = [
  <Heart key="heart" className="w-3.5 h-3.5" />,
  <Activity key="activity" className="w-3.5 h-3.5" />,
  <Zap key="zap" className="w-3.5 h-3.5" />,
]

interface HeroProps {
  siteName?: string
  bookingEnabled?: boolean
  mercadopagoEnabled?: boolean
  content?: HeroContent
}

export default function Hero({ siteName = 'Corpe Pilates', bookingEnabled = true, mercadopagoEnabled = true, content }: HeroProps) {
  const hero = { ...defaultHero, ...content }
  const showReservationButton = bookingEnabled

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Refined dot pattern */}
      <div className="absolute inset-0 pattern-dots opacity-20" />

      {/* Large decorative background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="font-display font-bold text-rose-100 select-none"
          style={{ fontSize: 'clamp(120px, 20vw, 280px)', lineHeight: 1, letterSpacing: '-0.02em', opacity: 0.35 }}
          aria-hidden="true"
        >
          Pilates
        </span>
      </div>

      {/* Subtle corner accents */}
      <div className="absolute top-24 left-8 w-px h-24 bg-gradient-to-b from-rose-300 to-transparent" />
      <div className="absolute top-24 left-8 w-24 h-px bg-gradient-to-r from-rose-300 to-transparent" />
      <div className="absolute bottom-24 right-8 w-px h-24 bg-gradient-to-t from-nude-300 to-transparent" />
      <div className="absolute bottom-24 right-8 w-24 h-px bg-gradient-to-l from-nude-300 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-stagger">
          {/* Eyebrow badge - more minimal */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-rose-400" />
            <span className="text-xs text-rose-600 font-semibold tracking-[0.2em] uppercase">{hero.eyebrow}</span>
            <div className="h-px w-8 bg-rose-400" />
          </div>

          {/* Main heading - two-line with weight contrast */}
          <h1 className="font-display mb-6" style={{ lineHeight: 1.05 }}>
            <span
              className="block text-gradient"
              style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', fontWeight: 400, fontStyle: 'italic' }}
            >
              {siteName}
            </span>
          </h1>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-nude-300" />
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-nude-300" />
          </div>

          <p className="text-lg sm:text-xl text-nude-600 max-w-xl mx-auto mb-10 leading-relaxed font-light">
            {hero.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <a
              href="#servicios"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-rose-800 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all hover:shadow-lg hover:shadow-rose-200 hover:-translate-y-0.5"
            >
              {hero.ctaPrimary}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            {showReservationButton && (
              <a
                href="/reservar"
                className="inline-flex items-center gap-2 px-8 py-4 border border-rose-300 text-rose-700 rounded-xl font-semibold hover:bg-rose-50 hover:border-rose-400 transition-all hover:-translate-y-0.5"
              >
                {hero.ctaSecondary}
              </a>
            )}
          </div>

          {/* Feature pills - more refined */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {hero.featurePills.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-rose-600">
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                  {pillIcons[i % pillIcons.length]}
                </div>
                <span className="text-nude-600 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator - refined */}
      <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-8 rounded-full border border-rose-300 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" />
          </div>
          <span className="text-xs text-rose-400 tracking-widest uppercase font-medium" style={{ fontSize: '0.6rem' }}>scroll</span>
        </div>
      </div>
    </section>
  )
}
