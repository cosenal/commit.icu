'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  subYears,
  format,
  isAfter,
  parseISO,
  getDay,
  getDate,
} from 'date-fns'

interface DayData {
  date: string
  status: 'none' | 'github' | 'strava' | 'both' | 'future'
  commitCount: number
  activityCount: number
}

export default function Home() {
  const [data, setData] = useState<DayData[]>([])
  const [authedStrava, setAuthedStrava] = useState(false)
  const [authedGitHub, setAuthedGitHub] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const [ghRes, stravaRes] = await Promise.all([
        fetch('/api/github/data', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/strava/data', { credentials: 'include' }).then((r) => r.json()),
      ])

      const cookieStr = document.cookie
      const stravaName = cookieStr.split('; ').find((row) => row.startsWith('strava_username='))?.split('=')[1]
      const githubName = cookieStr.split('; ').find((row) => row.startsWith('github_username='))?.split('=')[1]
      if (stravaName || githubName) {
        setUsername(decodeURIComponent(stravaName || githubName))
      }

      if (!stravaRes.error) setAuthedStrava(true)
      if (!ghRes.error) setAuthedGitHub(true)

      const githubMap = new Map<string, number>()
      ghRes?.data?.user?.contributionsCollection?.contributionCalendar?.weeks?.forEach((week: any) => {
        week.contributionDays.forEach((day: any) => {
          if (day.contributionCount > 0) {
            githubMap.set(day.date, day.contributionCount)
          }
        })
      })

      const stravaMap = new Map<string, number>()
      if (Array.isArray(stravaRes)) {
        stravaRes.forEach((activity: any) => {
          const date = activity.start_date?.slice(0, 10)
          if (date) {
            stravaMap.set(date, (stravaMap.get(date) || 0) + 1)
          }
        })
      }

      const today = new Date()
      const startDate = startOfWeek(subYears(today, 1), { weekStartsOn: 0 })
      const endDate = new Date(today) // ensure today is included
      const allDays = eachDayOfInterval({ start: startDate, end: endDate })

      const firstDayOfWeek = getDay(allDays[0])
      const paddedStart = Array.from({ length: firstDayOfWeek }, () => ({
        date: '',
        status: 'future',
        commitCount: 0,
        activityCount: 0,
      }))

      const mapped: DayData[] = allDays.map((d) => {
        const dateStr = d.toISOString().slice(0, 10)
        if (isAfter(d, today)) return { date: dateStr, status: 'future', commitCount: 0, activityCount: 0 }
        const commits = githubMap.get(dateStr) || 0
        const activities = stravaMap.get(dateStr) || 0

        let status: DayData['status'] = 'none'
        if (commits > 0 && activities > 0) status = 'both'
        else if (commits > 0) status = 'github'
        else if (activities > 0) status = 'strava'

        return { date: dateStr, status, commitCount: commits, activityCount: activities }
      })

      setData([...paddedStart, ...mapped])
    }

    loadData()
  }, [])

  const colorMap: Record<DayData['status'], string> = {
    none: 'bg-gray-100 border border-gray-200',
    github: 'bg-green-400 border border-gray-200',
    strava: 'bg-orange-400 border border-gray-200',
    both: 'bg-[#a3a34a] text-white border border-gray-200',
    future: 'bg-transparent',
  }

  const groupedByWeek: DayData[][] = []
  for (let i = 0; i < data.length; i += 7) {
    groupedByWeek.push(data.slice(i, i + 7))
  }

  const monthLabels = groupedByWeek.map((week, idx) => {
    const firstDay = week[0]
    if (!firstDay || !firstDay.date) return ''
    const date = parseISO(firstDay.date)
    if (idx === 0 || (idx > 0 && format(date, 'MMM') !== format(parseISO(groupedByWeek[idx - 1][0].date), 'MMM'))) {
      return format(date, 'MMM')
    }
    return ''
  })

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <main className="p-8 bg-white min-h-screen">
      <head>
        <link rel="icon" href="/icon.png" />
      </head>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-black">commit.icu</h1>
        {username && (
          <p className="text-sm text-black">Logged in as <strong>{username}</strong></p>
        )}
        
      </header>
      <p className="text-sm text-gray-600 max-w-xxl">
          Your commitment to coding and VO2max.
      </p>
      <div className="mb-6 flex flex-wrap gap-4">
        {!authedGitHub && (
          <Link
            href="/api/github/login"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Log in with GitHub
          </Link>
        )}
        {!authedStrava && (
          <Link
            href="/api/strava/login"
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Log in with Strava
          </Link>
        )}
      </div>

      <section className="overflow-x-auto">
        <div className="ml-10 flex text-xs text-gray-500 mb-1">
          {monthLabels.map((label, idx) => (
            <div key={idx} className="w-4 text-center">
              {label}
            </div>
          ))}
        </div>

        <div className="flex gap-[3px]">
          <div className="flex flex-col text-xs text-gray-400 mr-2 gap-[3px]">
            {weekdayLabels.map((label) => (
              <div key={label} className="w-6 h-4 leading-none">{label[0]}</div>
            ))}
          </div>

          {groupedByWeek.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px]">
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  className={`w-4 h-4 text-xs flex items-center justify-center rounded-sm ${colorMap[day.status]}`}
                  title={
                    day.status !== 'future'
                      ? `${day.date}\n🟩 ${day.commitCount} commits\n🟧 ${day.activityCount} activities`
                      : ''
                  }
                >
                  {''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 text-sm text-gray-700 flex flex-col gap-3">
        <p>🟩 GitHub | 🟧 Strava | 🫒 Both</p>
        <p className="text-xs text-gray-400">
          Made by <a href="https://github.com/cosenal" className="underline hover:text-black" target="_blank">@cosenal</a> ☕️
        </p>
      </footer>
    </main>
  )
}
