import { NextRequest, NextResponse } from 'next/server'
import { saveUser, getUserByGoogleId, createUserSession } from '@/lib/storage'
import type { User } from '@/data/config'

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
  expires_in: number
}

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const stateParam = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')
  
  const baseUrl = (process.env.NEXT_PUBLIC_URL || '').replace(/\/$/, '')
  
  let returnTo = '/'
  if (stateParam) {
    try {
      const state = JSON.parse(Buffer.from(stateParam, 'base64').toString())
      returnTo = state.returnTo || '/'
    } catch {}
  }
  
  if (error) {
    return NextResponse.redirect(`${baseUrl}${returnTo}?auth_error=${error}`)
  }
  
  if (!code) {
    return NextResponse.redirect(`${baseUrl}${returnTo}?auth_error=no_code`)
  }
  
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${baseUrl}/api/auth/google/callback`
  
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}${returnTo}?auth_error=not_configured`)
  }
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token error:', errorData)
      return NextResponse.redirect(`${baseUrl}${returnTo}?auth_error=token_failed`)
    }
    
    const tokens: GoogleTokenResponse = await tokenResponse.json()
    
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    
    if (!userInfoResponse.ok) {
      return NextResponse.redirect(`${baseUrl}${returnTo}?auth_error=userinfo_failed`)
    }
    
    const googleUser: GoogleUserInfo = await userInfoResponse.json()
    
    let user = await getUserByGoogleId(googleUser.id)
    
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        createdAt: Date.now(),
      }
      await saveUser(user)
    } else {
      user.name = googleUser.name
      user.picture = googleUser.picture
      await saveUser(user)
    }
    
    const sessionToken = await createUserSession(user.id)
    
    const response = NextResponse.redirect(`${baseUrl}${returnTo}`)
    response.cookies.set('user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })
    
    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${baseUrl}${returnTo}?auth_error=server_error`)
  }
}
