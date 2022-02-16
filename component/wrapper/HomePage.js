import MobileNavBar from "../navigationBar/mobile-nav-bar";
import Link from 'next/link'
import Icon from "../elements/Icon";
import logout from "../../utils/logout";
import React, { useEffect } from 'react';


export default function HomePage(props) {
  useEffect(() => {
    const btn = document.querySelector(".mobile-menu-button");
    const sidebar = document.querySelector(".sidebar");
    // add our event listener for the click
    btn.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
    });
  }, [])
  return (
    <div>
      <div className="relative min-h-screen md:flex">       
      <MobileNavBar></MobileNavBar>
      <div className={navBarClass}>
        <Link href="/">
          <a className="text-white flex items-center space-x-2 px-4">
            <Icon length="50"></Icon>
          </a>
        </Link>
        <nav>
          <a href="profile" className={navElemClass + (props.href == "profile" ? 'bg-indigo-900' : '')}>
            User Profile
          </a>
          <div className={navElemClass} onClick={logout}>
            Logout
          </div>
        </nav>
      </div>
        {props.children}
      </div>
    </div>
  )
}

// Tailwind classes definitions
// Side Navigation Bar elements
const navElemClass = "block p-3 rounded transition duration-200 hover:bg-indigo-800 hover:text-white cursor-pointer ";
// Side Navigation Bar
const navBarClass = "sidebar bg-gray-700 text-blue-100 w-64 space-y-2 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out";
