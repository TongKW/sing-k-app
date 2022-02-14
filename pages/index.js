import React, { useState, useEffect } from 'react';
import MobileNavBar from '../component/navigationBar/mobile-nav-bar';
import Icon from '../component/elements/Icon';
import { navBarClass, navElemClass } from '../styles/tailwindClasses';
import logout from '../utils/logout';

export default function Home() {
  const [username, setUsername] = useState("");
  useEffect(() => {
    const btn = document.querySelector(".mobile-menu-button");
    const sidebar = document.querySelector(".sidebar");
    // add our event listener for the click
    btn.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
    });
    setUsername(localStorage.getItem('username'));
  }, [])
  return (
    <div>
      <div className="relative min-h-screen md:flex">       
      <MobileNavBar></MobileNavBar>
      <div className={navBarClass}>
        <a href="#" className="text-white flex items-center space-x-2 px-4">
          <Icon length="50"></Icon>
        </a>
        <nav>
          <a href="profile" className={navElemClass}>
            User Profile
          </a>
          <div className={navElemClass} onClick={logout}>
            Logout
          </div>
        </nav>
      </div>
        <div className="flex-1 p-10 text-2xl font-bold">
          welcome, {username}!
        </div>
      </div>
    </div>
  )
}

// document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";