import React, { useState, useEffect, useRef } from "react";
import Button from "../../component/elements/button";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Box } from "@mui/material";
import { FormInputBlock } from "../../component/elements/form-input";

export default function Admin() {
  const [validated, setValidated] = useState(true);
  const [userList, setUserList] = useState();
  useEffect(() => {
    // validate admin user again by validating the token stored in local storage
    const token = localStorage.getItem('token');
    // TODO change if (true) to check valid
    if (true) {
      setValidated(true);
    } else {
      // Redirect to login page 
    }
  }, []);
  
  useEffect(() => {
    // retrieve all user info once admin ac is validated
    if (validated) {
      // Test cases right now
      const testUserList = [
        {
          userId: '1',
          username: 'username1',
          email: 'email1',
          avatar: 'avatar1'
        },
        {
          userId: '2',
          username: 'username2',
          email: 'email2',
          avatar: 'avatar1'
        }
      ]
      setUserList(testUserList);
      
      console.log(userList);
    }

  }, [validated]);

  if (!validated) {
    return (
      <div>Validating... </div>
    ) 
  } else {
    // List all user with their info:
    // username | email 
    // Clicking the username will redirect to view-profile and show their user profile.

    return (
      <>
        <TableContainer component={Paper} sx={{width: "70%", margin: "auto", mt: 5}} >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>username</TableCell>
                <TableCell>email</TableCell>
                <TableCell>new password</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userList && userList.map((userObj) => ListUsers(userObj.username, userObj.email))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    )
  }
}


function ListUsers(username, email){
  return(
    <TableRow>
      <TableCell>{username}</TableCell>
      <TableCell>{email}</TableCell>
      <TableCell><Box display="flex" pt={2}><FormInputBlock category="password"/><Box pl={2}/><Button text="confirm" /></Box></TableCell>
    </TableRow>
  );
}