import React from 'react';
import { useRouter } from 'next/router';
import Reset from './reset';
import Request from './request';

export default function CreateAccount(props) {
  const router = useRouter();
  // If reset_id is passed as path parameter
  // Prompt user to set new password
  if (("reset_id" in router.query)) {
    return (
      <Reset reset_id={router.query.reset_id}/>
    )
  } else {
    // Ask user to validate via email before letting them reset password
    return (
      <Request/>
    )
  }
}