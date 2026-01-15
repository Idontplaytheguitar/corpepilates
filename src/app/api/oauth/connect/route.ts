import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/oauth/callback`
  
  const authUrl = new URL('https://auth.mercadopago.com.ar/authorization')
  authUrl.searchParams.set('client_id', clientId || '')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('platform_id', 'mp')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  
  return NextResponse.redirect(authUrl.toString())
}
