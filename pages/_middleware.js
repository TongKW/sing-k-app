// This would run before any resources are delivered to clients
//
// Check the login status in cookies
// If not logged in, redirect to login page

import { NextResponse } from 'next/server'

export function middleware(req) {
  // If from api call, do not redirect to login page
  try {
    console.log(req.page.name)
    if (req.page.name.startsWith('/api')) return;
  } catch (error) {
    //
  }

  console.log(req.cookies);
  const isLogin = 'username' in req.cookies;
  return NextResponse.rewrite(`/${isLogin ? '' : 'login'}`);
} 