import React, { useState } from 'react';
import { useRouter } from "next/router";
import FormInput from '../../component/elements/form-input';
import Button from '../../component/elements/button';
import styles from '../../styles/Home.module.css'
import Icon from '../../component/elements/Icon';
import CreateAccount from './create-account';
import { Loading } from 'notiflix/build/notiflix-loading-aio';
import ActivateAccount from './activate-account';

export const states = Object.freeze({"login": 1, "create": 2, "forget": 3});

export default function Login() {
  const [username, setUserName] = useState();
  const [password, setPassword] = useState();
  const [error, setError] = useState();
  const [loginState, setLoginState] = useState(states.login);
  console.log(loginState);
  // Check if validate id is in the path query
  // If so, return to the activate account page
  const router = useRouter();
  // http://localhost:3000/login?validate_id=abc
  if ("validate_id" in router.query) {
    return (
      <ActivateAccount validate_id={router.query.validate_id}></ActivateAccount>
    )
  }

  // Return normal login page
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

  // Login logic
  async function login() {
    // Clear existing error message first
    setError();
    // Check if username and password fields are filled
    if (!username || !password) {
      setError("Username or password cannot be empty");
      return;
    }
    var request_body = {
      username: username, password: password
    };
    // Add loading indicator
    Loading.circle({svgColor: "#283593"});
    // Authenticate
    const response = await fetch('/api/users/auth', {
      method: 'POST', 
      body: JSON.stringify(request_body),
      headers: {
        'Content-Type': 'application/json'
      },
    });
    try {
      const data = await response.json();
      // Remove loading indicator after data is fetched
      Loading.remove();
      if ('token' in data) {
        // Login is successful
        // Store jwt and username in local storage
        localStorage.setItem('username', username);
        localStorage.setItem('token', data.token);
        // Store username in cookies
        document.cookie = `username=${username}`;
        console.log('reload');
        window.location.reload();
      } else {
        // Login not successful
        console.log("Login not successful")
        console.log(data["message"]);
        setError(data.message);
      }
    } catch (error) {
      // Remove loading indicator
      Loading.remove();
      console.log(error);
    }
  }
}