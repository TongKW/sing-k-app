import React, { useState, useEffect } from 'react';
import HomePage from '../component/wrapper/HomePage';

export default function Home() {
  const [username, setUsername] = useState("");
  useEffect(() => {
    setUsername(localStorage.getItem('username'));
  }, [])
  return (
    <HomePage>
      <div className="flex-1 p-10 text-2xl font-bold">
        Welcome back, {username}!
      </div>
    </HomePage>
  )
}