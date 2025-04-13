// src/app/api/github/data/route.ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

let cache: Record<string, any> | null = null
let lastFetched: number = 0

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  const username = cookieStore.get('github_username')?.value

  if (!token || !username) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
  }

  const now = Date.now()
  if (cache && now - lastFetched < 1000 * 60 * 60 * 24) {
    return NextResponse.json(cache)
  }

  const query = `
    {
      user(login: "${username}") {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  const data = await response.json()
  cache = data
  lastFetched = now

  return NextResponse.json(data)
}
