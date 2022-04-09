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
    if (req.cookies.username === 'admin') {
      // If admin user, redirect to admin home page
      if (req.url.includes('/admin/view-profile')) {
        return NextResponse.rewrite(url);;
      }
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    } else {
      // If not admin user and try to access admin pages, redirect to normal home page
      if (req.url.includes('/admin')) {
        url.pathname = '/';
        return NextResponse.rewrite(url);
      }
    }
    // If logged in users access login page, redirect to normal home page
    if (req.url.includes('/login')) {
      url.pathname = '/';
      return NextResponse.rewrite(url);
    }
  }
  
} 