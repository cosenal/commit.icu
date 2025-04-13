// src/app/api/strava/data/route.ts
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

let cache: any = null
let activities: any[] = []
let lastFetched: number = 0 // Initialize lastFetched here

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('strava_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with Strava' }, { status: 401 })
  }

  console.log('Using Strava token:', token)

  const now = Date.now()
  const isDev = process.env.NODE_ENV === 'development'
  const force = isDev && req.nextUrl.searchParams.get('force') === 'true'
  
  if (!force && cache && Date.now() - lastFetched < 1000 * 60 * 60 * 24) {
    return NextResponse.json(cache)
  }

  const perPage = 100
  const maxPages = 3

  for (let page = 1; page <= maxPages; page++) {
    console.log(`Fetching page ${page} from Strava...`)
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      console.error(`Failed to fetch activities from Strava. Status: ${response.status}`)
      const error = await response.text()
      console.error('Error response:', error)
      break
    }

    const data = await response.json()
    console.log('Response:', data)
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No more activities to fetch.')
      break
    }

    activities = activities.concat(data)
  }

  cache = activities
  lastFetched = now // Set the lastFetched value when the data is updated

  console.log('Final activities:', activities)

  return NextResponse.json(activities)
}
