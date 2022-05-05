import React, { useState, useEffect, useRef } from "react";
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
  AppBar,
  Toolbar,
  Autocomplete,
  TextField,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { FormInputBlock } from "../../component/elements/form-input";
import logout from "../../utils/logout";
import pwValidateSetError from "../../utils/validate-password-format";
import { Loading } from "notiflix/build/notiflix-loading-aio";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HomePage from "../../component/wrapper/HomePage";
import sortOnKey from "../../utils/sortOnKey";

// This component generates the admin view
export default function Admin() {
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [validated, setValidated] = useState(false);
  const [userList, setUserList] = useState();
  const [filteredUserList, setFilteredUserList] = useState();
  const [usernameDescending, setUsernameDescending] = useState(false);
  const [emailDescending, setEmailDescending] = useState(false);
  const [searchFieldOption, setSearchFieldOption] = useState([]);
  const [searchFieldOptionName, setSearchFieldOptionName] =
    useState("username");
  const [searchBarValue, setSearchBarValue] = useState(searchFieldOption[0]);
  const [searchBarInputValue, setSearchBarInputValue] = useState("");
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
        setFilteredUserList(data);
        setSearchFieldOption(data.map((userObj) => userObj.username));
        setSearchFieldOptionName("username");
      }
      (async () => {
        getUsersList();
      })();
    }
  }, [validated]);

  // this function changes the password when the admin pass in userId and new password to the database
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

  // this function is a top level function which handles the admin on request
  // change the password of the user, by passing in userId, password and the
  // callback of setting password error
  async function handleChangePw(userId, password, setPasswordError) {
    setPasswordError();
    if (pwValidateSetError(password, setPasswordError)) {
      return;
    }
    Loading.circle({ svgColor: "#283593" });
    let uploadedPw;
    try {
      uploadedPw = await changePw(userId, password);
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

  // this function is a top level function which handles the admin on request
  // view the user profile by requiring the userID
  function handleViewProfile(userId) {
    router.push(`/admin/view-profile/${userId}`);
  }

  // this function is a top level function which handles the admin on request
  // sort the username data
  const handleSortUsernameDescending = () => {
    const newUsernameDescending = !usernameDescending;
    const newFilteredUserList = sortOnKey(
      filteredUserList,
      "username",
      newUsernameDescending
    );
    setUsernameDescending(newUsernameDescending);
    setFilteredUserList(newFilteredUserList);
  };

  // this function is a top level function which handles the admin on request
  // sort the email data
  const handleSortEmailDescending = () => {
    const newEmailDescending = !emailDescending;
    const newFilteredUserList = sortOnKey(
      filteredUserList,
      "email",
      newEmailDescending
    );
    setEmailDescending(newEmailDescending);
    setFilteredUserList(newFilteredUserList);
  };

  // this function is a top level function which handles when the search bar field
  // value changes
  const handleSearchFieldChange = (event) => {
    const newSearchField = event.target.value;
    if (newSearchField !== searchFieldOptionName) {
      if (event.target.value === "username")
        setSearchFieldOption(userList?.map((userObj) => userObj.username));
      else setSearchFieldOption(userList?.map((userObj) => userObj.email));
      setSearchFieldOptionName(event.target.value);
      setSearchBarValue("");
      setSearchBarInputValue("");
      setFilteredUserList(userList);
    }
  };

  // this function is a top level function which handles when the search bar selected option
  // value changes
  const handleSearchValueChange = (_, value) => setSearchBarValue(value);

  // this function is a top level function which handles when the search bar selected input
  // value changes
  const handleSearchInputValueChange = (_, value) => {
    setSearchBarInputValue(value);
    const pattern = new RegExp(value);
    const newFilteredUserList = userList.filter((_, index) =>
      pattern.test(searchFieldOption[index])
    );
    setFilteredUserList(newFilteredUserList);
  };

  if (!validated) {
    return <div>Validating... </div>;
  } else {
    return (
      <>
        {fetching ? (
          <div>Fetching user data...</div>
        ) : (
          <HomePage role={"admin"}>
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              <Box sx={{ width: "100%" }}>
                <AppBar
                  sx={{
                    background: "#444",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                  position="sticky"
                >
                  <Toolbar
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <Autocomplete
                      freeSolo
                      options={searchFieldOption}
                      value={searchBarValue}
                      onChange={handleSearchValueChange}
                      inputValue={searchBarInputValue}
                      onInputChange={handleSearchInputValueChange}
                      sx={{ width: { xs: "50vw", md: "30vw" } }}
                      size="small"
                      renderInput={(params) => {
                        return (
                          <TextField
                            {...params}
                            sx={{
                              backgroundColor: "#fff",
                              borderRadius: "5px",
                            }}
                          />
                        );
                      }}
                    />
                    <Box pl={2} />
                    <FormControl size="small">
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        sx={{
                          background: "#fff",
                          width: { xs: "30vw", md: "15vw" },
                        }}
                        value={searchFieldOptionName}
                        onChange={handleSearchFieldChange}
                      >
                        <MenuItem value={"username"}>Username</MenuItem>
                        <MenuItem value={"email"}>Email</MenuItem>
                      </Select>
                    </FormControl>
                  </Toolbar>
                </AppBar>
              </Box>

              <TableContainer
                component={Paper}
                sx={{ width: { xs: "80%", sm: "70%" }, margin: "auto", my: 5 }}
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
                            alignItems: "center",
                          }}
                        >
                          Username <Box pl={1} />
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
                            alignItems: "center",
                          }}
                        >
                          Email
                          <Box pl={1} />
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
                    {filteredUserList &&
                      filteredUserList.map((userObj, index) => (
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
            </Box>
          </HomePage>
        )}
      </>
    );
  }
}

// this is a component that list all the users data and allow admin to change their password respectively
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
