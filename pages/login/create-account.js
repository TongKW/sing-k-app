import React, { useState } from 'react';
import FormInput from '../../component/elements/form-input';
import Button from '../../component/elements/button';
import styles from '../../styles/Home.module.css'
import axios from 'axios';
import Icon from '../../component/elements/Icon';
import { formTitleClass } from '../../styles/tailwindClasses';
import { states } from '.';

export default function CreateAccount(props) {
  const [username, setUserName] = useState();
  const [password, setPassword] = useState();
  const [dupPassword, setDupPassword] = useState();
  const [error, setError] = useState();
  const [dupError, setDupError] = useState();
  const [status, setStatus] = useState(false);
  if (!status) {
    return (
      <div className={styles.container}>
        <Icon></Icon>
        <div className="w-full max-w-xs pt-10">
          <form className="bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
            <div className="flex items-center justify-between pb-2">
              <a className="cursor-pointer inline-block align-baseline text-sm text-indigo-700 hover:text-indigo-800"
                onClick={() => {props.setLoginState(states.login)}}
              >
                ← back
              </a>
            </div>
            <label className={formTitleClass} htmlFor="username">
              Username
            </label>
            <div className="mb-4 text-gray-700">
              <FormInput id="username" type="text" placeholder="Username" onChange={setUserName} warning={error}></FormInput>
              <p style={{display:`${error ? 'block' : 'none'}`}} className="text-red-700 text-xs italic mt-3">{error}</p>
            </div>
            <label className={formTitleClass} htmlFor="username">
              Password
            </label>
            <div className="mb-4">
              <FormInput id="password" type="password" placeholder="Password" onChange={setPassword}></FormInput>
            </div>
            <div className="mb-4">
              <FormInput type="password" placeholder="Repeat password" onChange={setDupPassword} warning={dupError}></FormInput>
              <p style={{display:`${dupError ? 'block' : 'none'}`}} className="text-red-700 text-xs italic mt-3">{dupError}</p>
            </div>
            <div className="flex items-center justify-between">
              <div onClick={validate}>
                <Button text="Confirm"></Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  } else {
    return (
      <div className={styles.container}>
        <div className='pb-6'>
          <Icon></Icon>
        </div>
          <div className="text-center bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
            Successfully created account
            <div className="text-center pt-4">
              <div onClick={() => {props.setLoginState(states.login)}}>
                <Button text="Return"></Button>
              </div>
            </div>
          </div>
      </div>
    )
  }

  // Create account
  async function validate() {
    if (password !== dupPassword) {
      setDupError("Repeat password is not the same");
      setError();
      return;
    }
    var request_body = {
      username: username, password: password
    }
    // Register account
    axios.post(`${process.env.NEXT_PUBLIC_HOST}/api/users/register`, request_body)
    .then(function (response) {
      console.log(response.data)
      if (response.data.success) {
        setStatus(true);
        return;
      } else {
        setError(response.data.message);
      }
    })
    .catch(function (error) {
      //console.log(error);
    });
  }
}
