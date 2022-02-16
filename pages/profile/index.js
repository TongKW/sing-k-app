import React, { useState } from 'react';
import HomePage from '../../component/wrapper/HomePage';

export default function Profile() {
  const [username, setUsername] = useState("");
  return (
    <HomePage href='profile'>
      <div className="flex-1 p-10 text-2xl font-bold">
        Welcome back, !
      </div>
    </HomePage>
  )
}