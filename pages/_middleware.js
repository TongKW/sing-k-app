// Check the login status in cookies
// If not logged in, redirect to login page

import { NextResponse } from 'next/server'

export function middleware(req) {
  // If from api call, do not redirect to login page
  if (req.page.name.startsWith('/api')) return;

  const isLogin = 'loginToken' in req.cookies;
  return NextResponse.rewrite(`/${isLogin ? '' : 'login'}`);
} 