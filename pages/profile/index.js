import React, { useState, useEffect } from 'react';
import HomePage from '../../component/wrapper/HomePage';
import {
  Box,
  Badge,
  Avatar,
  LinearProgress,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';


const SmallAvatar = styled(Avatar)(({ theme }) => ({
  width: 22,
  height: 22,
  border: `2px solid ${theme.palette.background.paper}`,
  [theme.breakpoints.up('md')]: {
    width: 32,
    height: 32,
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(9),
  height: theme.spacing(9),
  [theme.breakpoints.up('md')]: {
    width: theme.spacing(17),
    height: theme.spacing(17),
  },
}));


export default function Profile() {
  const [username, setUsername] = useState();
  const [email, setEmail] = useState();
  // Avatar in base64 encoding
  const [avatar, setAvatar] = useState();
  const description = "Hello, everyone!";
  const userExp = 10;
  const ExpToNextLevel = 100;
  const bar=Number(userExp)/Number(ExpToNextLevel)*100;

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
      <Box sx={{ display: "flex", flexDirection: "row", alignContent: "center", alignItems: "center"}}>
        <Box sx={{ display: "flex", flexDirection: "column", width: {xs: "30%", md: "20%"}, alignContent: "center", alignItems: "center"}}>
          <Box>
            <center>
              <Badge
                overlap="circular"
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                badgeContent={<SmallAvatar src="https://cdn0.iconfinder.com/data/icons/professional-avatar-10/65/38-512.png" />}
              >
                <UserAvatar encoding={avatar} mx="auto"/>
              </Badge>
            </center>
          </Box>
          <Box sx={{ width: {xs: "80%", md: "100%"}, mt: {xs:1, md: 2} }} >
            <LinearProgress variant="determinate" value={bar}/>
            <Typography variant="subtitle2" color="white" ><Box sx={{ fontSize: 10, mr: "80%"}}>{`${userExp}/${ExpToNextLevel} `}</Box></Typography>
          </Box>
        </Box>
        <Box ml={3}/>
        <Box sx={{ width: {xs: "70%", md: "80%"} }}>
          {description}
        </Box>
        </Box>
        <Box display="block">
          Username: {username}
        </Box>
        <Box display="block">
          Email: {email}
        </Box>
      </div>
    </HomePage>
  )
}