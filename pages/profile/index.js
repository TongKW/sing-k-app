import React, { useState, useEffect } from 'react';
//import Avatar from '../../component/elements/Avatar';
import HomePage from '../../component/wrapper/HomePage';
import {
  Box,
  Badge,
  makeStyles,
  Avatar,
  withStyles,
} from '@material-ui/core';
import {styled} from '@mui/styles';



const SmallAvatar = withStyles((theme) => ({
  root: {
    width: 22,
    height: 22,
    border: `2px solid ${theme.palette.background.paper}`,
  },
}))(Avatar);



const useStyles = makeStyles((theme) => ({
  userAvatar: {
    width: theme.spacing(7),
    height: theme.spacing(7),
    [theme.breakpoints.up('md')]: {
      width: theme.spacing(17),
      height: theme.spacing(17),
    },
  },
}));

export default function Profile() {
  const classes = useStyles();
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
        <center>
        <Badge
          overlap="circular"
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          badgeContent={<SmallAvatar alt="Remy Sharp" src="https://cdn0.iconfinder.com/data/icons/professional-avatar-10/65/38-512.png" />}
        >
          <Avatar encoding={avatar} className={classes.userAvatar} mx="auto"/>
        </Badge></center>
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