import { NextRequest, NextResponse } from 'next/server'
import { getUserSession, getUserById } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('user_session')?.value
  
  if (!sessionToken) {
    return NextResponse.json({ user: null })
  }
  
  const session = await getUserSession(sessionToken)
  
  if (!session) {
    const response = NextResponse.json({ user: null })
    response.cookies.delete('user_session')
    return response
  }
  
  const user = await getUserById(session.userId)
  
  if (!user) {
    const response = NextResponse.json({ user: null })
    response.cookies.delete('user_session')
    return response
  }
  
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    }
  })
}
