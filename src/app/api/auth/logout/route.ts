import { NextRequest, NextResponse } from 'next/server'
import { deleteUserSession } from '@/lib/storage'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('user_session')?.value
  
  if (sessionToken) {
    await deleteUserSession(sessionToken)
  }
  
  const response = NextResponse.json({ success: true })
  response.cookies.delete('user_session')
  
  return response
}
