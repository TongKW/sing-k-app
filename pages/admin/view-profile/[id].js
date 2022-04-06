import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Box, Avatar } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FormInputBlock } from "../../../component/elements/form-input";
import FormTitle from "../../../component/elements/form-title";

export default function ViewProfile(){
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
            console.log(data);
            if (data.authorized) {
                const user = data.body;
                if (user.username == "admin"){
                    setValidated(true);
                }
            } else {
                // Unauthorized user or jwt expired
                // Prompt to login page
                alert("Invalid operation");
                logout();
            }
        }
    }, []);

    function findUserInfo(user){
        return user.userId === userId;
    }

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

    useEffect(() => {
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

    if(userInfo){
        return(
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
    }else{
        return (
            <>
                <Box>Loading...</Box>
            </>
        );
    }
}