import { getRedis } from './redis'

const FEE_KEY = 'corpepilates:fee_enabled'
const FEE_PERCENTAGE_KEY = 'corpepilates:fee_percentage'
const DEVELOPMENT_PAID_KEY = 'corpepilates:development_paid'

export async function isDevelopmentPaid(): Promise<boolean> {
  try {
    const redis = getRedis()
    const paid = await redis.get(DEVELOPMENT_PAID_KEY)
    return paid === 'true'
  } catch {
    return false
  }
}

export async function setDevelopmentPaid(paid: boolean): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.set(DEVELOPMENT_PAID_KEY, paid ? 'true' : 'false')
    if (paid) {
      await redis.set(FEE_KEY, 'false')
    }
    return true
  } catch {
    return false
  }
}

export async function isFeeEnabled(): Promise<boolean> {
  try {
    const paid = await isDevelopmentPaid()
    if (paid) return false
    
    const redis = getRedis()
    const enabled = await redis.get(FEE_KEY)
    return enabled !== 'false'
  } catch {
    return true
  }
}

export async function getFeePercentage(): Promise<number> {
  try {
    const redis = getRedis()
    const percentage = await redis.get(FEE_PERCENTAGE_KEY)
    return percentage ? parseInt(percentage) : 5
  } catch {
    return 5
  }
}

export async function setFeeEnabled(enabled: boolean): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.set(FEE_KEY, enabled ? 'true' : 'false')
    return true
  } catch {
    return false
  }
}

export async function setFeePercentage(percentage: number): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.set(FEE_PERCENTAGE_KEY, percentage.toString())
    return true
  } catch {
    return false
  }
}

export async function getFeeStatus(): Promise<{ 
  enabled: boolean
  percentage: number
  developmentPaid: boolean 
}> {
  const [enabled, percentage, developmentPaid] = await Promise.all([
    isFeeEnabled(),
    getFeePercentage(),
    isDevelopmentPaid(),
  ])
  return { enabled, percentage, developmentPaid }
}
