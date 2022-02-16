// This would run before any resources are delivered to clients
//
// Check the login status in cookies
// If not logged in, redirect to login page

import { NextResponse } from 'next/server'

export function middleware(req) {
  // If from api call, do not redirect to login page
  try {
    if (req.url.includes('/api')) return;
  } catch (error) {
    //
  }

  console.log(`req.cookies: ${req.cookies}`);
  const isLogin = 'username' in req.cookies;
  if (!isLogin) {
    return NextResponse.rewrite('login');
  }
  
} 