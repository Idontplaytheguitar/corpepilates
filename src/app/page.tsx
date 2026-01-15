import Hero from '@/components/Hero'
import ServicesSection from '@/components/ServicesSection'
import PacksSection from '@/components/PacksSection'
import ProductsSection from '@/components/ProductsSection'
import AboutSection from '@/components/AboutSection'
import { getStoredConfig } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const config = await getStoredConfig()

  return (
    <>
      <Hero 
        siteName={config.site.siteName} 
        bookingEnabled={config.booking?.enabled}
        mercadopagoEnabled={config.site.mercadopagoEnabled !== false}
      />
      <ServicesSection 
        services={config.services} 
        bookingEnabled={config.booking?.enabled}
        mercadopagoEnabled={config.site.mercadopagoEnabled !== false}
        location={config.site.location}
        whatsapp={config.site.whatsapp}
        email={config.site.email}
      />
      <PacksSection 
        packs={config.packs}
        whatsapp={config.site.whatsapp}
        packsEnabled={config.site.packsEnabled !== false}
        mercadopagoEnabled={config.site.mercadopagoEnabled !== false}
      />
      {config.site.productsEnabled && (
        <ProductsSection 
          products={config.products}
          whatsapp={config.site.whatsapp}
          email={config.site.email}
        />
      )}
      <AboutSection />
    </>
  )
}
