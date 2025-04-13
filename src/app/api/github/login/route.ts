import { NextResponse } from 'next/server'

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: 'http://localhost:3000/api/github/callback',
    scope: 'read:user user:email repo',
    allow_signup: 'true',
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}

