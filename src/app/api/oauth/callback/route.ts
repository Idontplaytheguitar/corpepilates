import { NextRequest, NextResponse } from 'next/server'
import { saveSellerCredentials, SellerCredentials } from '@/lib/marketplace'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${baseUrl}/admin?oauth=error&message=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/admin?oauth=error&message=no_code`)
  }

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CLIENT_ID || '',
        client_secret: process.env.CLIENT_SECRET || '',
        code: code,
        redirect_uri: `${baseUrl}/api/oauth/callback`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OAuth token error:', errorData)
      return NextResponse.redirect(`${baseUrl}/admin?oauth=error&message=token_error`)
    }

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

    return NextResponse.redirect(`${baseUrl}/admin?oauth=success`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${baseUrl}/admin?oauth=error&message=unknown`)
  }
}
