import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { UserProvider } from '@/context/UserContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getStoredConfig } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStoredConfig()
  return {
    title: `${config.site.siteName} | ${config.site.tagline}`,
    description: 'Pilates Reformer para todos. Fortalecé tu core, cuidá tu columna y transformá tu cuerpo con clases personalizadas.',
    keywords: 'pilates, reformer, core, columna, postura, fuerza, flexibilidad, clases, floresta, caba',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = await getStoredConfig()

  return (
    <html lang="es">
      <body className="antialiased">
        <UserProvider>
          <CartProvider>
            <Header siteName={config.site.siteName} tagline={config.site.tagline} productsEnabled={config.site.productsEnabled} packsEnabled={config.site.packsEnabled !== false} />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer config={config.site} />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  )
}
