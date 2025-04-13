import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL('/', request.url);
  const response = NextResponse.redirect(url);

  // Clear both the strava_token and strava_username cookies
  response.cookies.set('strava_username', '', { maxAge: 0, path: '/' });
  response.cookies.set('strava_token', '', { maxAge: 0, path: '/' });

  return response;
}
