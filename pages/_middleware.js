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

  console.log(`req.cookies: ${JSON.stringify(req.cookies)}`);
  const isLogin = 'isLogin' in req.cookies;
  console.log(isLogin);
  if (!isLogin) {
    return NextResponse.rewrite('/login');
  } else {
    if (req.url.includes('/login')) {
      return NextResponse.rewrite('/');
    }
  }
  
} 