import React, { useState } from 'react';
import FormInput from '../../component/elements/form-input';
import Button from '../../component/elements/button';
import styles from '../../styles/Home.module.css'
import axios from 'axios';
import Icon from '../../component/elements/Icon';
import CreateAccount from './create-account';

export const states = Object.freeze({"login": 1, "create": 2, "forget": 3});

export default function Login() {
  const [username, setUserName] = useState();
  const [password, setPassword] = useState();
  const [error, setError] = useState();
  const [loginState, setLoginState] = useState(states.login);
  console.log(loginState);
  if (loginState === states.login) {
    // Login page
    return (
      <div className={styles.container}>
        <Icon></Icon>
        <div className="w-full max-w-xs pt-10">
          <form className="bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
            <div className="mb-4 text-gray-700">
              <FormInput id="username" type="text" placeholder="Username" onChange={setUserName}></FormInput>
            </div>
            <div className="mb-4">
              <FormInput id="password" type="password" placeholder="Password" onChange={setPassword} warning={error}></FormInput>
              <p style={{display:`${error ? 'block' : 'none'}`}} className="text-red-700 text-xs italic mt-3">{error}</p>
            </div>
            <div className="flex items-center justify-between">
              <div onClick={login}>
                <Button text="Login"></Button>
              </div>
              <a className="cursor-pointer inline-block align-baseline text-sm text-indigo-700 hover:text-indigo-800">
                Forgot Password
              </a>
            </div>
            <div className='content-center pt-3' onClick={() => {setLoginState(states.create)}}>
              <a className="cursor-pointer text-center text-sm text-indigo-700 hover:text-indigo-800">
                Create account
              </a>
            </div>
          </form>
        </div>
      </div>
    )
  } else if (loginState === states.create) {
    return (
      <CreateAccount setLoginState={setLoginState}/>
    )
  } else {
    return;
  }

  // Login handler
  async function login() {
    // Check if username and password fields are filled
    if (!username || !password) {
      setError("Username or password cannot be empty");
      return;
    }
    var request_body = {
      username: username, password: password
    };
    // Authenticate
    axios.post(`${process.env.NEXT_PUBLIC_HOST}/api/users/auth`, request_body)
      .then(function (response) {
        console.log(response.data)
        if ('token' in response.data) {
          // Login is successful
          // Store jwt and username in local storage
          localStorage.setItem('username', username);
          localStorage.setItem('token', response.data.token);
          // Store username in cookies
          document.cookie = `username=${username}`;
          console.log('reload');
          window.location.reload();
        } else {
          // Login not successful
          console.log("Login not successful")
          console.log(response.data["message"]);
          setError(response.data.message);
        }
      })
      .catch(function (error) {
        //console.log(error);
      });
  }
}
