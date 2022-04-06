import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Button from "../../component/elements/button";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
  IconButton,
} from "@mui/material";
import { FormInputBlock } from "../../component/elements/form-input";
import logout from "../../utils/logout";
import pwValidateSetError from "../../utils/validate-password-format";
import { Loading } from "notiflix/build/notiflix-loading-aio";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function Admin() {
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [username, setUsername] = useState();
  const [validated, setValidated] = useState(false);
  const [userList, setUserList] = useState();
  useEffect(() => {
    // validate admin user again by validating the token stored in local storage
    if (fetching) {
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
          setUsername(user.username);

          if (user.username == "admin") {
            setValidated(true);
          } else {
            // logout();
            router.push("/profile");
          }
        } else {
          // Unauthorized user or jwt expired
          // Prompt to login page
          alert("Invalid operation");
          logout();
        }
      }
      (async () => {
        const token = localStorage.getItem("token");
        decrypt_jwt(token);
      })();
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    // retrieve all user info once admin ac is validated
    if (validated) {
      // Test cases right now
      const testUserList = [
        {
          userId: "1",
          username: "username1",
          email: "email1",
          avatar: "avatar1",
        },
        {
          userId: "2",
          username: "username2",
          email: "email2",
          avatar: "avatar1",
        },
      ];
      setUserList(testUserList);
    }
  }, [validated]);

  async function changePw(userId, newPw) {
    const requestBody = { id: userId, password: newPw };
    const response = await fetch("/api/users/update", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });
    try {
      const data = await response.json();
      return { success: data.success, error: data.message };
    } catch (error) {
      return { success: false, error: null };
    }
  }

  async function handleChangePw(userId, password, setPasswordError) {
    console.log(password);
    console.log(userId);
    setPasswordError();
    if (pwValidateSetError(password, setPasswordError)) {
      return;
    }
    Loading.circle({ svgColor: "#283593" });
    let uploadedPw;
    try {
      uploadedPw = await changePw(userId, password);
      console.log("uploadedPw = ", uploadedPw);
    } catch (error) {
      alert(`Unknown error occurs: ${error}`);
      return;
    } finally {
      Loading.remove();
    }
    if (!uploadedPw.success) {
      alert("Unknown error occurs");
      return;
    }
  }

  function handleViewProfile(userId) {
    router.push(`/admin/view-profile/${userId}`);
  }

  if (!validated) {
    return <div>Validating... </div>;
  } else {
    // List all user with their info:
    // username | email
    // Clicking the username will redirect to view-profile and show their user profile.

    return (
      <>
        {fetching ? (
          <div>Validating...</div>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ width: { xs: "80%", sm: "70%" }, margin: "auto", mt: 5 }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>New password</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userList &&
                  userList.map((userObj, index) => (
                    <ListUser
                      key={index}
                      username={userObj.username}
                      email={userObj.email}
                      userId={userObj.userId}
                      handleChangePw={handleChangePw}
                      handleViewProfile={handleViewProfile}
                    />
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </>
    );
  }
}

function ListUser(props) {
  const [password, setPassword] = useState();
  const [passwordError, setPasswordError] = useState();

  return (
    <TableRow>
      <TableCell>{props.username}</TableCell>
      <TableCell>{props.email}</TableCell>
      <TableCell>
        <Box display="flex" alignItems="center">
          <Box pt={2} width="70%">
            <FormInputBlock
              category="password"
              value={password}
              onChange={setPassword}
              warning={passwordError}
            />
          </Box>
          <Box sx={{ pl: { xs: 1, sm: 2 } }} />
          <Button
            text="confirm"
            onClick={() =>
              props.handleChangePw(props.userId, password, setPasswordError)
            }
          />
          <Box sx={{ pl: { xs: 0, sm: 1 } }} />
          <IconButton onClick={() => props.handleViewProfile(props.userId)}>
            <VisibilityIcon />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
}
