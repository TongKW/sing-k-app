import React, { useState, useEffect } from 'react';
import Avatar from '../../component/elements/Avatar';
import HomePage from '../../component/wrapper/HomePage';

export default function Profile() {
  const [username, setUsername] = useState();
  const [email, setEmail] = useState();
  // Avatar in base64 encoding
  const [avatar, setAvatar] = useState();

  // Get the token stored in local storage
  // Send decrypt request to server
  // Get response of user info and display
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = decrypt_jwt(token).body;
    
    async function decrypt_jwt(token) {
      const response = await fetch('/api/jwt/decrypt', {
        method: 'POST', 
        body: JSON.stringify({ token: token }),
        headers: {
          'Content-Type': 'application/json'
        },
      });
      const data = await response.json();
      console.log(data);
      if (data.authorized) {
        const user = data.body;
        setUsername(user.username);
        setEmail(user.email);
        setAvatar(user.avatar);
      } else {
        // Unauthorized user or jwt expired
        // Prompt to login page
      }
    }
  }, []);

  return (
    <HomePage href='profile'>
      <div className="flex-1 p-10 text-2xl font-bold">
        Profile page
        <br/>
        <Avatar encoding={avatar}/>
        <br/>
        {username}
        <br/>
        {email}
      </div>
    </HomePage>
  )
}