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

const testPacks = [
  {
    id: 'pack-4',
    name: 'Pack 4 Clases',
    description: 'Ideal para probar. Compra 4 clases y agenda cuando quieras dentro de los 30 dias.',
    classCount: 4,
    price: 28000,
    validityDays: 30,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
  },
  {
    id: 'pack-8',
    name: 'Pack 8 Clases',
    description: 'El mas popular. 8 clases para usar en 45 dias con total flexibilidad de horarios.',
    classCount: 8,
    price: 52000,
    validityDays: 45,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
  },
  {
    id: 'pack-12',
    name: 'Pack 12 Clases',
    description: 'Maximo ahorro. 12 clases para usar en 60 dias. Ideal para entrenar regularmente.',
    classCount: 12,
    price: 72000,
    validityDays: 60,
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=400&fit=crop',
  },
]

async function seedPacks() {
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
  
  config.packs = testPacks
  
  await client.set(CONFIG_KEY, JSON.stringify(config))
  
  console.log('Packs seeded:')
  testPacks.forEach(p => console.log(`  - ${p.name}: $${p.price} (${p.classCount} clases)`))
  
  await client.quit()
  console.log('Done!')
}

seedPacks().catch(console.error)
