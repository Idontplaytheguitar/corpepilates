import { Heart, Activity, Target, Award } from 'lucide-react'

export default function AboutSection() {
  return (
    <section id="sobre-mi" className="py-24 bg-cream-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-4 -right-4 w-64 h-64 bg-nude-200 rounded-full blur-3xl opacity-30" />
            
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop"
                    alt="Pilates Reformer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop"
                    alt="Ejercicio de core"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="pt-8 space-y-4">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=400&fit=crop"
                    alt="Clase de pilates"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=600&fit=crop"
                    alt="Flexibilidad y fuerza"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="text-rose-500 text-sm font-medium tracking-widest uppercase">
              Sobre Nosotros
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-rose-800 mt-2 mb-6">
              Pilates Reformer
            </h2>
            
            <div className="space-y-4 text-nude-600 leading-relaxed">
              <p>
                El Pilates Reformer es una modalidad que utiliza una cama especial con resortes 
                que regulan la tensión, simulando el levantamiento de peso de forma controlada 
                y segura para tus articulaciones.
              </p>
              <p>
                La idea principal es trabajar el músculo profundo del abdomen (el famoso core) 
                para cuidar la columna vertebral y mejorar la postura. Además, trabajamos 
                piernas, brazos y espalda para generar más fuerza y tonificación muscular.
              </p>
              <p>
                Con clases personalizadas y atención al detalle, te acompañamos en tu 
                transformación física respetando los tiempos de tu cuerpo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <FeatureCard
                icon={<Heart className="w-5 h-5" />}
                title="Cuidá tu Columna"
                description="Protección y fortalecimiento"
              />
              <FeatureCard
                icon={<Activity className="w-5 h-5" />}
                title="Core Fuerte"
                description="Músculo profundo del abdomen"
              />
              <FeatureCard
                icon={<Target className="w-5 h-5" />}
                title="Postura Correcta"
                description="Alineación corporal"
              />
              <FeatureCard
                icon={<Award className="w-5 h-5" />}
                title="Instructora Certificada"
                description="Clases personalizadas"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-cream-100 hover-lift">
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-3">
        {icon}
      </div>
      <h3 className="font-medium text-rose-800">{title}</h3>
      <p className="text-sm text-nude-500">{description}</p>
    </div>
  )
}
