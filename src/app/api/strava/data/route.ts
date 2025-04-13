// src/app/api/strava/data/route.ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

let cache: any = null
let activities: any[] = []
let lastFetched: number = 0 // Initialize lastFetched here

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('strava_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with Strava' }, { status: 401 })
  }

  const now = Date.now()
  if (cache && now - lastFetched < 1000 * 60 * 60 * 24) {
    return NextResponse.json(cache)
  }

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
  lastFetched = now // Set the lastFetched value when the data is updated

  return NextResponse.json(activities)
}
