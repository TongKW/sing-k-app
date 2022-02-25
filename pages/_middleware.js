// This would run before any resources are delivered to clients
//
// Check the login status in cookies
// If not logged in, redirect to login page

import { NextResponse } from 'next/server'

export function middleware(req) {
  // If from api call, do not redirect to login page
  try {
    if (req.url.includes('/api') || req.url.includes('/activate-account') || req.url.includes('/reset-password')) return;
  } catch (error) {
    //
  }

  const url = req.nextUrl.clone()
  console.log(`req.cookies: ${JSON.stringify(req.cookies)}`);
  const isLogin = 'isLogin' in req.cookies;
  console.log(isLogin);
  if (!isLogin) {
    url.pathname = '/login';
    return NextResponse.rewrite(url);
  } else {
    if (req.url.includes('/login')) {
      url.pathname = '/';
      return NextResponse.rewrite(url);
    }
  }
  
} 