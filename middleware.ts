import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = 'vtask-xfq3.vercel.app';

export function middleware(req: NextRequest) {
  const hostname = req.nextUrl.hostname;

  // ローカル開発は除外
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return NextResponse.next();
  }

  // canonical 以外は canonical に 308 リダイレクト
  if (hostname !== CANONICAL_HOST) {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // 静的ファイル類は除外（必要最低限）
  matcher: ['/((?!_next|favicon.ico|icon.svg).*)'],
};
