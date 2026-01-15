import { Heart, Instagram, MessageCircle, Mail } from 'lucide-react'
import type { SiteConfig } from '@/data/config'

interface FooterProps {
  config: SiteConfig
}

export default function Footer({ config }: FooterProps) {
  const whatsappDisplay = config.whatsapp.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3-$4')
  const instagramHandle = config.instagram.split('/').pop() || 'corpepilates'

  return (
    <footer id="contacto" className="bg-rose-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-display text-3xl font-semibold mb-4">{config.siteName}</h3>
            <p className="text-rose-200 leading-relaxed">
              {config.tagline}. Transformá tu cuerpo con clases personalizadas de Pilates Reformer.
            </p>
            <div className="flex gap-4 mt-6">
              <SocialLink href={config.instagram} icon={<Instagram className="w-5 h-5" />} />
              <SocialLink href={`https://wa.me/${config.whatsapp}`} icon={<MessageCircle className="w-5 h-5" />} />
              <SocialLink href={`mailto:${config.email}`} icon={<Mail className="w-5 h-5" />} />
            </div>
          </div>

          <div>
            <h4 className="font-display text-xl font-medium mb-4">Enlaces</h4>
            <ul className="space-y-3">
              <li>
                <a href="/#servicios" className="text-rose-200 hover:text-white transition-colors">
                  Planes
                </a>
              </li>
              <li>
                <a href="/#productos" className="text-rose-200 hover:text-white transition-colors">
                  Productos
                </a>
              </li>
              <li>
                <a href="/#sobre-mi" className="text-rose-200 hover:text-white transition-colors">
                  Sobre Nosotros
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xl font-medium mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href={`https://wa.me/${config.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-rose-200 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{whatsappDisplay}</span>
                </a>
              </li>
              <li>
                <a 
                  href={`mailto:${config.email}`}
                  className="flex items-center gap-2 text-rose-200 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>{config.email}</span>
                </a>
              </li>
              <li>
                <a 
                  href={config.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-rose-200 hover:text-white transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>@{instagramHandle}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-rose-800 mt-12 pt-8 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
          <p className="text-rose-300 text-sm">
            © {new Date().getFullYear()} {config.siteName}. Todos los derechos reservados.
          </p>
          <div className="flex flex-col items-center sm:items-end gap-1">
            <p className="text-rose-300 text-sm flex items-center gap-1">
              Hecho con <Heart className="w-4 h-4 text-rose-400 fill-rose-400" /> en Argentina
            </p>
            <a 
              href="mailto:aguskenny@hotmail.com?subject=Quiero una página como Corpe Pilates"
              className="text-rose-500/50 hover:text-rose-300 text-xs transition-colors"
            >
              Quiero una página personalizada como esta
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-rose-800 hover:bg-rose-700 flex items-center justify-center transition-colors"
    >
      {icon}
    </a>
  )
}
