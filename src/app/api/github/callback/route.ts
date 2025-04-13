import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  if (!accessToken) {
    return NextResponse.json({ error: 'No GitHub token returned' }, { status: 400 })
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const userData = await userRes.json()

  const cookieStore = await cookies()
  cookieStore.set('github_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  cookieStore.set('github_username', userData.login || 'GitHubUser', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  return NextResponse.redirect('http://localhost:3000')
}
