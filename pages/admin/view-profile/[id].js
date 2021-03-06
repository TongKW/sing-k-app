import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Box, Avatar } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FormInputBlock } from "../../../component/elements/form-input";
import FormTitle from "../../../component/elements/form-title";

// this component returns the user profile page view from the admin side
export default function ViewProfile() {
  const router = useRouter();
  const userId = router.query.id;
  const [validated, setValidated] = useState(false);
  const [userList, setUserList] = useState([]);
  const [userInfo, setUserInfo] = useState();

  useEffect(() => {
    // validate admin user again by validating the token stored in local storage
    const token = localStorage.getItem("token");
    decrypt_jwt(token);

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
  }, []);

  // this function checks whether the input user has the same ID as the request query parameter
  function findUserInfo(user) {
    return user._id === userId;
  }

  useEffect(() => {
    // retrieve all user info once admin ac is validated
    if (validated) {
      // this function gets all the users from the api
      async function getUsersList() {
        const response = await fetch("/api/users/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setUserList(data);
      }
      (async () => {
        getUsersList();
      })();
    }
  }, [validated]);

  useEffect(() => {
    //whenever the user list or query parameter id changes, we find the userInfo with the same ID as the query parameter
    setUserInfo(userList.find(findUserInfo));
  }, [userList, userId]);

  const UserAvatar = styled(Avatar, {
    shouldForwardProp: (prop) => ["src"].includes(prop),
  })(({ src, theme }) => ({
    width: theme.spacing(17),
    height: theme.spacing(17),
    border: `4px solid ${theme.palette.background.paper}`,
    src: src,
  }));

  if (userInfo) {
    return (
      <>
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
                      <UserAvatar src={userInfo.avatar} mx="auto" />
                    </center>
                  </Box>
                </Box>
              </center>
              <Box mt={3} />
              <Box>
                <form>
                  <FormTitle title="username" />
                  <FormInputBlock
                    category="username"
                    value={userInfo.username}
                    readOnly={true}
                  />
                  <FormTitle title="email" />
                  <FormInputBlock
                    category="email"
                    value={userInfo.email}
                    readOnly={true}
                  />
                </form>
              </Box>
            </div>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <Box>Loading...</Box>
      </>
    );
  }
}
