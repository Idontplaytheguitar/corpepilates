const Redis = require('ioredis')

const REDIS_URL = process.env.REDIS_URL || 'redis://default:CGwrvEn9CgBdsxsV6woaB0hIU3etKV7s@redis-11642.c57.us-east-1-4.ec2.cloud.redislabs.com:11642'

async function setup() {
  console.log('🔌 Conectando a Redis...')
  
  const redis = new Redis(REDIS_URL)
  
  try {
    await redis.set('corpepilates:development_paid', 'true')
    console.log('✅ corpepilates:development_paid = true')
    
    await redis.set('corpepilates:fee_enabled', 'false')
    console.log('✅ corpepilates:fee_enabled = false')
    
    console.log('\n🎉 Listo! Desarrollo marcado como pago, sin comisión.')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await redis.quit()
  }
}

setup()
