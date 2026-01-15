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
      <Hero siteName={config.site.siteName} />
      <ServicesSection 
        services={config.services} 
        bookingEnabled={config.booking?.enabled}
        location={config.site.location}
        whatsapp={config.site.whatsapp}
        email={config.site.email}
      />
      <PacksSection 
        packs={config.packs}
        whatsapp={config.site.whatsapp}
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
