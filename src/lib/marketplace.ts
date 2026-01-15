import { kv } from '@vercel/kv'

export interface SellerCredentials {
  accessToken: string
  refreshToken: string
  userId: string
  publicKey: string
  expiresAt: number
  connectedAt: number
  feeEnabled: boolean
  feePercentage: number
}

const SELLER_KEY = 'corpepilates:seller'

export async function getSellerCredentials(): Promise<SellerCredentials | null> {
  try {
    return await kv.get<SellerCredentials>(SELLER_KEY)
  } catch {
    return null
  }
}

export async function saveSellerCredentials(credentials: SellerCredentials): Promise<boolean> {
  try {
    await kv.set(SELLER_KEY, credentials)
    return true
  } catch (error) {
    console.error('Error saving seller credentials:', error)
    return false
  }
}

export async function updateSellerFee(feeEnabled: boolean, feePercentage: number = 5): Promise<boolean> {
  try {
    const seller = await getSellerCredentials()
    if (!seller) return false
    
    seller.feeEnabled = feeEnabled
    seller.feePercentage = feePercentage
    await kv.set(SELLER_KEY, seller)
    return true
  } catch {
    return false
  }
}

export async function disconnectSeller(): Promise<boolean> {
  try {
    await kv.del(SELLER_KEY)
    return true
  } catch {
    return false
  }
}

export async function refreshSellerToken(refreshToken: string): Promise<SellerCredentials | null> {
  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.CLIENT_ID || '',
        client_secret: process.env.CLIENT_SECRET || '',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    
    const credentials: SellerCredentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: data.user_id.toString(),
      publicKey: data.public_key,
      expiresAt: Date.now() + (data.expires_in * 1000),
      connectedAt: Date.now(),
      feeEnabled: true,
      feePercentage: 5,
    }

    await saveSellerCredentials(credentials)
    return credentials
  } catch {
    return null
  }
}

export async function getValidSellerToken(): Promise<string | null> {
  const seller = await getSellerCredentials()
  if (!seller) return null

  if (Date.now() > seller.expiresAt - 60000) {
    const refreshed = await refreshSellerToken(seller.refreshToken)
    return refreshed?.accessToken || null
  }

  return seller.accessToken
}
