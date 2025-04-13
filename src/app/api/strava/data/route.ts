// src/app/api/strava/data/route.ts
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

let cache: any = null
let lastFetched: number = 0

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('strava_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with Strava' }, { status: 401 })
  }

  const now = Date.now()
  if (cache && now - lastFetched < 1000 * 60 * 60 * 24) {
    return NextResponse.json(cache)
  }

  let activities: any[] = []
  const perPage = 100
  const maxPages = 3

  for (let page = 1; page <= maxPages; page++) {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) break

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) break

    activities = activities.concat(data)
  }

  cache = activities
  lastFetched = now

  return NextResponse.json(activities)
}
