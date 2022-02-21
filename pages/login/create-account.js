import React, { useState } from 'react';
import { FormInputBlock } from '../../component/elements/form-input';
import Button from '../../component/elements/button';
import styles from '../../styles/Home.module.css'
import Icon from '../../component/elements/Icon';
import { states } from '.';
import { Loading } from 'notiflix/build/notiflix-loading-aio';
import validateFormat from '../../utils/validate-email-format';
import FromTitle from '../../component/elements/form-title';

export default function CreateAccount(props) {
  const [username, setUserName] = useState();
  const [password, setPassword] = useState();
  const [email, setEmail] = useState();
  const [dupPassword, setDupPassword] = useState();
  const [error, setError] = useState();
  const [dupError, setDupError] = useState();
  const [emailError, setEmailError] = useState();
  const [status, setStatus] = useState(false);
  if (!status) {
    return (
      <div className={styles.container}>
        <Icon></Icon>
        <div className="w-full max-w-xs pt-10">
          <form className="bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
            {/* Back */}
            <div className="flex items-center justify-between pb-2">
              <a className="cursor-pointer inline-block align-baseline text-sm text-indigo-700 hover:text-indigo-800"
                onClick={() => {props.setLoginState(states.login)}}
              >
                ← back
              </a>
            </div>
            {/* Username block */}
            <FromTitle title="username"/>
            <FormInputBlock category="username" onChange={setUserName} warning={error}></FormInputBlock>
            {/* Email block */}
            <FromTitle title="email"/>
            <FormInputBlock category="email" onChange={setEmail} warning={emailError}></FormInputBlock>
            {/* Password block */}
            <FromTitle title="password"/>
            <FormInputBlock category="password" onChange={setPassword}></FormInputBlock>
            {/* Duplicate Password block */}
            <FormInputBlock category="confirm password" onChange={setDupPassword} warning={dupError}></FormInputBlock>
            {/* Confirm */}
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
            A verification link will be sent to you via email. <br></br>
            Click into the link within 24 hours to activate your account.
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
    // Clear all errors first
    setDupError();
    setError();
    setEmailError();
    // Check if email is filled and with correct format
    if (!email) {
      setEmailError("Email must be filled");
      return;
    } else {
      if (!validateFormat(email)) {
        setEmailError("Incorrect email format");
        return;
      }
    }

    // Validate confirm password before making request
    if (password !== dupPassword) {
      setDupError("Confirm password is not the same");
      setError();
      return;
    }
    // Add loading indicator
    Loading.circle({svgColor: "#283593"});
    // Register account
    var request_body = {
      username: username, password: password, email: email
    };
    const response = await fetch('/api/users/register', {
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
      if (data.success) {
        // Send an activation email to user
        await fetch('/api/email/invite', {
          method: 'POST', 
          body: JSON.stringify({ email: email, username: username, validate_id: data.validate_id }),
          headers: {
            'Content-Type': 'application/json'
          },
        });
        setStatus(true);
        return;
      } else {
        if (data.usernameExists) {
          setError("Username has been used");
        }
        if (data.emailExists) {
          setEmailError("Email has been used");
        }  
      }
    } catch (error) {
      // Remove loading indicator
      Loading.remove();
    }
  }
}