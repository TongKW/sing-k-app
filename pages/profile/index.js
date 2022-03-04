import React, { useState, useEffect, useCallback } from "react";
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
import { LocalConvenienceStoreOutlined } from "@mui/icons-material";
import checkFileSize from "../../utils/checkFileSize";

const Input = styled("input")({
  display: "none",
});

const ProfileIconButton = styled(IconButton)(({ theme }) => ({
  width: 32,
  height: 32,
}));

const ProfileIcon = styled(Avatar)(({ theme }) => ({
  width: 35,
  height: 35,
  border: `3px solid ${theme.palette.background.paper}`,
}));

const UserAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => ["src"].includes(prop),
})(({ src, theme }) => ({
  width: theme.spacing(17),
  height: theme.spacing(17),
  border: `4px solid ${theme.palette.background.paper}`,
  src: src,
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  width: theme.spacing(19),
}));

export default function Profile() {
  const [userId, setUserId] = useState();
  const [oldUsername, setOldUsername] = useState();
  const [oldEmail, setOldEmail] = useState();
  const [oldAvatar, setOldAvatar] = useState();
  const [username, setUsername] = useState();
  const [email, setEmail] = useState();
  // Avatar in base64 encoding
  const [avatar, setAvatar] = useState();
  const [usernameError, setUsernameError] = useState();
  const [uploadPhoto] = useFileUpload({
    onStarting: (event) => {
      const [file] = event.target.files;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64 = reader.result;
        if (avatarTooLarge(base64)) {
          alert("Avatar is too large!");
          return;
        }
        setAvatar(base64);
      };
    },
  });
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
        setUserId(user._id);
        setOldUsername(user.username);
        setOldEmail(user.email);
        setOldAvatar(user.avatar);
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
        <div className="grid grid-cols-10 gap-8">
          <div className="col-start-3 col-span-6">
            <center>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "60%",
                alignContent: "center",
                alignItems: "center",
                justifyContent: "center",
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
                    badgeContent={<UploadImageButton onChange={uploadPhoto} />}
                  >
                    <UserAvatar src={avatar} mx="auto" />
                  </Badge>
                </center>
              </Box>
              <Box
                sx={{ mt: { xs: 1, md: 2 } }}
              >
                <StyledLinearProgress variant="determinate" value={bar} />
                <Typography variant="subtitle2" color="white">
                  <Box
                    sx={{ fontSize: 10, mr: "100%" }}
                  >{`${userExp}/${ExpToNextLevel} `}</Box>
                </Typography>
              </Box>
            </Box></center>
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
                  readOnly={true}
                />
                <div className="flex items-center justify-between">
                  <div onClick={updateProfile}>
                    <Button text="Save" />
                  </div>
                </div>
              </form>
            </Box>
          </div>
        </div>
      </div>
    </HomePage>
  );

  function avatarTooLarge(base64) {
    const fileSize = checkFileSize(base64);
    console.log(fileSize);
    if (fileSize > 360000) return true;
    return false;
  }

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

  async function updateSessionToken(id, username, email, avatar) {
    const token = localStorage.getItem("token");
    const requestBody = { token, id, username, email, avatar };
    const response = await fetch("/api/jwt/encrypt", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      return null;
    }
    if (responseData.success) {
      return responseData.token;
    } else {
      return null;
    }
  }

  //Update user profile
  async function updateProfile() {
    setUsernameError();
    setEmailError();
    if (
      username === oldUsername &&
      email === oldEmail &&
      avatar === oldAvatar
    ) {
      return;
    }
    //TODO: check whether the new username has been used
    if (username !== oldUsername) {
      const usernameExists = await validateUsername(username);
      if (usernameExists === null) {
        alert("Unknown error occurs!");
        return;
      } else if (usernameExists) {
        setUsernameError("Username has been used");
        return;
      }
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
    if (avatar !== oldAvatar) {
      request_body.avatar = avatar;
    }
    let response;
    try {
      response = await fetch("/api/users/update", {
        method: "POST",
        body: JSON.stringify(request_body),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      alert(`Unknown error occurs! ${error}`);
      Loading.remove();
      return;
    }
    try {
      const data = await response.json();
      if (data.success) {
        const newToken = await updateSessionToken(
          userId,
          username,
          email,
          avatar
        );
        if (newToken === null) {
          alert("Unknown error occurs!");
          return;
        } else localStorage.setItem("token", newToken);
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

function UploadImageButton(props) {
  return (
    <label htmlFor="upload-image">
      <ProfileIconButton
        color="primary"
        aria-label="upload picture"
        component="span"
      >
        <ProfileIcon>
          <Input
            accept="image/*"
            id="upload-image"
            type="file"
            onChange={props.onChange}
          />
          <AddAPhotoIcon
            color="primary"
            sx={{ fontSize: 22 }}
          />
        </ProfileIcon>
      </ProfileIconButton>
    </label>
  );
}

function useFileUpload({ onStarting } = {}) {
  const [fileName, setFileName] = useState(undefined);
  const uploadFile = useCallback(
    (file) => {
      if (!file) {
        alert("Please upload a file!");
        return;
      }
      setFileName(file.name);
      onStarting(file);
    },
    [onStarting]
  );
  return [uploadFile];
}
