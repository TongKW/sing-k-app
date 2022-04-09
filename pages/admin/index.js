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
  Image,
} from "@mui/material";
import { FormInputBlock } from "../../component/elements/form-input";
import logout from "../../utils/logout";
import pwValidateSetError from "../../utils/validate-password-format";
import { Loading } from "notiflix/build/notiflix-loading-aio";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HomePage from "../../component/wrapper/HomePage";
import sortOnKey from "../../utils/sortOnKey";
import Icon from "../../component/elements/Icon";

export default function Admin() {
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [validated, setValidated] = useState(false);
  const [userList, setUserList] = useState();
  const [usernameDescending, setUsernameDescending] = useState(false);
  const [emailDescending, setEmailDescending] = useState(false);
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
          if (user.username == "admin") {
            setValidated(true);
          } else {
            alert("Unauthorized user. Redirect to user profile...");
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
      async function getUsersList() {
        const response = await fetch("/api/users/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setUserList(data);
        console.log(data);
      }
      (async () => {
        getUsersList();
      })();
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

  const updateUI = () => setValue((value) => !value);

  const handleSortUsernameDescending = () => {
    const newUsernameDescending = !usernameDescending;
    const newUserList = sortOnKey(userList, "username", newUsernameDescending);
    setUsernameDescending(newUsernameDescending);
    setUserList(newUserList);
  };

  const handleSortEmailDescending = () => {
    const newEmailDescending = !emailDescending;
    const newUserList = sortOnKey(userList, "email", newEmailDescending);
    setEmailDescending(newEmailDescending);
    setUserList(newUserList);
  };

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
          <HomePage role={"admin"}>
            <TableContainer
              component={Paper}
              sx={{ width: { xs: "80%", sm: "70%" }, margin: "auto", mt: 5 }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      onClick={handleSortUsernameDescending}
                      style={{ cursor: "pointer" }}
                    >
                      <Box
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "80%",
                        }}
                      >
                        Username
                        {usernameDescending ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-sort-up-alt"
                            viewBox="0 0 16 16"
                          >
                            <path d="M3.5 13.5a.5.5 0 0 1-1 0V4.707L1.354 5.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 4.707V13.5zm4-9.5a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1h-1zm0 3a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1h-3zm0 3a.5.5 0 0 1 0-1h5a.5.5 0 0 1 0 1h-5zM7 12.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-sort-down"
                            viewBox="0 0 16 16"
                          >
                            <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                          </svg>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell
                      onClick={handleSortEmailDescending}
                      style={{ cursor: "pointer" }}
                    >
                      <Box
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "60%",
                        }}
                      >
                        Email
                        {emailDescending ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-sort-up-alt"
                            viewBox="0 0 16 16"
                          >
                            <path d="M3.5 13.5a.5.5 0 0 1-1 0V4.707L1.354 5.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 4.707V13.5zm4-9.5a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1h-1zm0 3a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1h-3zm0 3a.5.5 0 0 1 0-1h5a.5.5 0 0 1 0 1h-5zM7 12.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-sort-down"
                            viewBox="0 0 16 16"
                          >
                            <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                          </svg>
                        )}
                      </Box>
                    </TableCell>
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
                        userId={userObj._id}
                        handleChangePw={handleChangePw}
                        handleViewProfile={handleViewProfile}
                      />
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </HomePage>
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
