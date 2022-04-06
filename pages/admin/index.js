import React, { useState, useEffect } from "react";
import Button from "../../component/elements/button";

export default function Admin() {
  const [validated, setValidated] = useState(false);
  const [userList, setUserList] = useState()
  useEffect(() => {
    // validate admin user again by validating the token stored in local storage
    const token = localStorage.getItem('token');
    // TODO change if (true) to check valid
    if (true) {
      setValidated(true)
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
        <tr>
          <th>username</th>
          <th>email</th>
          <th>new password</th>
          <th></th>
        </tr>
        {userList.map((userObj) => (
          <tr key={userObj.userId}>
            <td>{userObj.username}</td>
            <td>{userObj.email}</td>
            <td>new password text field:</td>
            <td><Button text="confirm"></Button></td>
          </tr>
        ))}
      </>
    )
  }
}
