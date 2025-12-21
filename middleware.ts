import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = 'vtask-xfq3.vercel.app';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host');

  // host が本番URL以外なら、本番URLへリダイレクト
  if (host && host !== CANONICAL_HOST) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = 'https';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

// Nextの静的ファイル等は除外
export const config = {
  matcher: ['/((?!_next|favicon.ico|icon.svg).*)'],
};
