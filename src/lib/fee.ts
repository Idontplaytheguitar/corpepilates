import { kv } from '@vercel/kv'

const FEE_KEY = 'corpepilates:fee_enabled'
const FEE_PERCENTAGE_KEY = 'corpepilates:fee_percentage'
const DEVELOPMENT_PAID_KEY = 'corpepilates:development_paid'

export async function isDevelopmentPaid(): Promise<boolean> {
  try {
    const paid = await kv.get<boolean>(DEVELOPMENT_PAID_KEY)
    return paid === true
  } catch {
    return false
  }
}

export async function setDevelopmentPaid(paid: boolean): Promise<boolean> {
  try {
    await kv.set(DEVELOPMENT_PAID_KEY, paid)
    if (paid) {
      await kv.set(FEE_KEY, false)
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
    
    const enabled = await kv.get<boolean>(FEE_KEY)
    return enabled !== false
  } catch {
    return true
  }
}

export async function getFeePercentage(): Promise<number> {
  try {
    const percentage = await kv.get<number>(FEE_PERCENTAGE_KEY)
    return percentage ?? 5
  } catch {
    return 5
  }
}

export async function setFeeEnabled(enabled: boolean): Promise<boolean> {
  try {
    await kv.set(FEE_KEY, enabled)
    return true
  } catch {
    return false
  }
}

export async function setFeePercentage(percentage: number): Promise<boolean> {
  try {
    await kv.set(FEE_PERCENTAGE_KEY, percentage)
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
