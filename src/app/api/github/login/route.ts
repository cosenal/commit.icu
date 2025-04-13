import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://commit.icu'

  const redirectUri = `${baseUrl}/api/github/callback`

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'read:user',
    allow_signup: 'true',
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}
