import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  const data = await response.json()

  const cookieStore = await cookies()

  cookieStore.set('strava_token', data.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  cookieStore.set('strava_username', data.athlete?.username || data.athlete?.firstname || 'StravaUser', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  return NextResponse.redirect('http://localhost:3000')
}
