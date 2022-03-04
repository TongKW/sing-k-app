import React, { useState, useEffect } from "react";
import HomePage from "../../component/wrapper/HomePage";
import { FormInputBlock } from "../../component/elements/form-input";
import FormTitle from "../../component/elements/form-title";
import Button from "../../component/elements/button";
import { Loading } from "notiflix/build/notiflix-loading-aio";
import validateFormat from "../../utils/validate-email-format";
import logout from "../../utils/logout";
import {
  Box,
  Badge,
  Avatar,
  LinearProgress,
  Typography,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";

const Input = styled('input')({
  display: "none"
});

function UploadImageButton() {
  return (
    <label htmlFor="upload-image">
      <ProfileIconButton
        color="primary"
        aria-label="upload picture"
        component="span"
      >
        <ProfileIcon>
          <Input accept="image/*" id="upload-image" type="file" />
          <AddAPhotoIcon color="primary" sx={{ fontSize: {xs: 15, md:22} }}/>
        </ProfileIcon>
      </ProfileIconButton>
    </label>
  );
}


const ProfileIconButton = styled(IconButton)(({ theme }) => ({
  width: 22,
  height: 22,
  [theme.breakpoints.up("md")]: {
    width: 32,
    height: 32,
  },
}));

const ProfileIcon = styled(Avatar)(({ theme }) => ({
  width: 25,
  height: 25,
  border: `3px solid ${theme.palette.background.paper}`,
  [theme.breakpoints.up("md")]: {
    width: 35,
    height: 35,
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(9),
  height: theme.spacing(9),
  border: `4px solid ${theme.palette.background.paper}`,
  [theme.breakpoints.up("md")]: {
    width: theme.spacing(17),
    height: theme.spacing(17),
  },
}));

export default function Profile() {
  const [oldUsername, setOldUsername] = useState();
  const [oldEmail, setOldEmail] = useState();
  const [username, setUsername] = useState();
  const [email, setEmail] = useState();
  // Avatar in base64 encoding
  const [avatar, setAvatar] = useState();
  const [usernameError, setUsernameError] = useState();
  const [emailError, setEmailError] = useState();
  const [updatedProfileStatus, setUpdatedProfileStatus] = useState(false);
  const userExp = 10;
  const ExpToNextLevel = 100;
  const bar = (Number(userExp) / Number(ExpToNextLevel)) * 100;

  // Get the token stored in local storage
  // Send decrypt request to server
  // Get response of user info and display
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = decrypt_jwt(token).body;

    async function decrypt_jwt(token) {
      const response = await fetch("/api/jwt/decrypt", {
        method: "POST",
        body: JSON.stringify({ token: token }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(data);
      if (data.authorized) {
        const user = data.body;
        setOldUsername(user.username);
        setOldEmail(user.email);
        setUsername(user.username);
        setEmail(user.email);
        setAvatar(user.avatar);
      } else {
        // Unauthorized user or jwt expired
        // Prompt to login page
        alert("Invalid operation");
        logout();
      }
    }
  }, []);

  return (
    <HomePage href="profile">
      <div className="flex-1 p-10 text-2xl font-bold">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: { xs: "30%", md: "20%" },
              alignContent: "center",
              alignItems: "center",
            }}
          >
            <Box>
              <center>
                <Badge
                  overlap="circular"
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  badgeContent={ <UploadImageButton /> }
                >
                  <UserAvatar encoding={avatar} mx="auto" />
                </Badge>
              </center>
            </Box>
            <Box
              sx={{ width: { xs: "80%", md: "100%" }, mt: { xs: 1, md: 2 } }}
            >
              <LinearProgress variant="determinate" value={bar} />
              <Typography variant="subtitle2" color="white">
                <Box
                  sx={{ fontSize: 10, mr: "80%" }}
                >{`${userExp}/${ExpToNextLevel} `}</Box>
              </Typography>
            </Box>
          </Box>
          <Box mt={3} />
          <Box>
            <form>
              <FormTitle title="username" />
              <FormInputBlock
                category="username"
                value={username}
                onChange={setUsername}
                warning={usernameError}
              />
              <FormTitle title="email" />
              <FormInputBlock
                category="email"
                value={email}
                onChange={setEmail}
                warning={emailError}
              />
              <div className="flex items-center justify-between">
                <div onClick={updateProfile}>
                  <Button text="Save" />
                </div>
              </div>
            </form>
          </Box>
        </Box>
      </div>
    </HomePage>
  );

  async function decryptSessionToken() {
    const token = localStorage.getItem("token");
    const requestBody = { token: token };
    const errorResponse = { success: false, error: null };
    let response;
    try {
      response = await fetch("/api/jwt/decrypt", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return errorResponse;
    }
    try {
      const data = await response.json();
      return { success: data.body.id, error: null };
    } catch (error) {
      return errorResponse;
    }
  }

  async function validateUsername(username) {
    Loading.circle({ svgColor: "#283593" });
    const requestBody = { username: username };
    const response = await fetch("/api/users/username-exists", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });
    try {
      const data = await response.json();
      return data.exists;
    } catch (error) {
      return null;
    } finally {
      Loading.remove();
    }
  }

  //Update user profile
  async function updateProfile() {
    setUsernameError();
    setEmailError();

    if (username === oldUsername && email === oldEmail) {
      return;
    }
    //TODO: check whether the new username has been used
    const usernameExists = await validateUsername(username);
    if (usernameExists === null) {
      alert("Unknown error occurs!");
    } else if (usernameExists) {
      setUsernameError("Username has been used");
      return;
    }

    if (!email) {
      setEmailError("Email must be filled");
      return;
    } else {
      if (!validateFormat(email)) {
        setEmailError("Incorrect email format");
        return;
      }
    }

    Loading.circle({ svgColor: "#283593" });
    const decryptionSuccess = await decryptSessionToken();
    if (!decryptionSuccess.success) {
      alert(`Unknown error occurs`);
      return;
    }
    const userId = decryptionSuccess.success;

    const request_body = {
      id: userId,
    };
    if (username !== oldUsername) {
      request_body.username = username;
    }
    if (email !== oldEmail) {
      request_body.email = email;
    }
    const response = await fetch("/api/users/update", {
      method: "POST",
      body: JSON.stringify(request_body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    try {
      const data = await response.json();
      if (data.success) {
        // const newToken = await function ();
        // localStorage.setItem("token", newToken);
        setUpdatedProfileStatus(true);
        alert("Profile is successfully update.");
        return;
      }
    } catch (error) {
      alert("Unknown error occurs");
    } finally {
      Loading.remove();
    }
  }
}
