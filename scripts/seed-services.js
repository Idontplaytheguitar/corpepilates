const fs = require('fs')
const path = require('path')
const Redis = require('ioredis')

function loadEnv() {
  const envFiles = ['.env', '.env.local']
  for (const file of envFiles) {
    const envPath = path.join(__dirname, '..', file)
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      content.split('\n').forEach(line => {
        if (line.startsWith('#') || !line.includes('=')) return
        const eqIndex = line.indexOf('=')
        const key = line.substring(0, eqIndex).trim()
        let value = line.substring(eqIndex + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (key && !process.env[key]) {
          process.env[key] = value
        }
      })
    }
  }
}

loadEnv()

const CONFIG_KEY = 'corpepilates:config'

const services = [
  {
    id: 'clase-suelta',
    name: 'Clase Suelta',
    description: 'Una clase de Pilates Reformer. Ideal si querés probar o venir de manera esporádica sin compromiso.',
    price: 9000,
    duration: '60 min',
    durationMinutes: 60,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
  },
  {
    id: 'clase-duo',
    name: 'Clase Dúo',
    description: 'Clase para 2 personas en reformers individuales. Ideal para venir con una amiga, pareja o familiar.',
    price: 14000,
    duration: '60 min',
    durationMinutes: 60,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
  },
  {
    id: 'clase-privada',
    name: 'Clase Privada',
    description: 'Sesión personalizada uno a uno. Atención exclusiva para trabajar tus objetivos específicos.',
    price: 18000,
    duration: '60 min',
    durationMinutes: 60,
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=400&fit=crop',
  },
]

async function seedServices() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.error('REDIS_URL no configurada en .env')
    process.exit(1)
  }
  
  console.log('Conectando a Redis...')
  const client = new Redis(redisUrl)
  
  console.log('Conectado a Redis')
  
  const existingData = await client.get(CONFIG_KEY)
  let config = existingData ? JSON.parse(existingData) : {}
  
  console.log('\nServicios anteriores:')
  if (config.services && config.services.length > 0) {
    config.services.forEach(s => console.log(`  - ${s.name}: $${s.price}`))
  } else {
    console.log('  (ninguno)')
  }
  
  config.services = services
  
  await client.set(CONFIG_KEY, JSON.stringify(config))
  
  console.log('\nNuevos servicios:')
  services.forEach(s => console.log(`  - ${s.name}: $${s.price} (${s.durationMinutes} min)`))
  
  await client.quit()
  console.log('\nDone!')
}

seedServices().catch(console.error)
