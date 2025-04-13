import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 })
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

  if (!response.ok) {
    const error = await response.json()
    console.error('Error exchanging code for token:', error)
    return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 500 })
  }

  const data = await response.json()
  const token = data.access_token

  if (!token) {
    return NextResponse.json({ error: 'Access token missing' }, { status: 500 })
  }

  console.log('Received Strava token:', token)

  const cookieStore = await cookies()

  cookieStore.set('strava_token', token, {
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
