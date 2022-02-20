import React, { useState, useEffect } from "react";
import Link from 'next/link'
import Button from "../../component/elements/button";
import Icon from "../../component/elements/Icon";
import styles from '../../styles/Home.module.css';
import { Loading } from 'notiflix/build/notiflix-loading-aio';


export default function ActivateAccount(props) {
  const [message, setMessage] = useState();
  useEffect(() => {
    // Add loading indicator
    Loading.circle({svgColor: "#283593"});
    // Handle activation request
    fetchMyAPI();

    async function fetchMyAPI() {
      try {
        const response = await fetch('/api/email/activate', {
          method: 'POST', 
          body: JSON.stringify({ validate_id: props.validate_id }),
          headers: {
            'Content-Type': 'application/json'
          },
        });
        const data = await response.json();
        setMessage(data.message);
        Loading.remove();
      } catch (error) {
        setMessage("Unknown error occurred");
        Loading.remove();
      }
      
    }
  }, [props.validate_id]);
  return (
    <div className={styles.container}>
      <div className='pb-6'>
        <Icon></Icon>
      </div>
        <div className="text-center bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
          {message}
          <div className="text-center pt-4">
            <Link href="/login">
              <a>
                <Button text="Return"></Button>
              </a>
            </Link>
          </div>
        </div>
    </div>
  )
}