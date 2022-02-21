import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from 'next/link'
import Button from "../../component/elements/button";
import Icon from "../../component/elements/Icon";
import styles from '../../styles/Home.module.css';
import { Loading } from 'notiflix/build/notiflix-loading-aio';


export default function ActivateAccount() {
  const [message, setMessage] = useState();
  const router = useRouter();
  
  useEffect(() => {
    if (!("validate_id" in router.query)) {
      setMessage("Invalid activation link.")
      return;
    }
    const validate_id = router.query.validate_id;
    // Add loading indicator
    Loading.circle({svgColor: "#283593"});
    // Handle activation request
    validate();

    async function validate() {
      try {
        const response = await fetch('/api/email/activate', {
          method: 'POST', 
          body: JSON.stringify({ validate_id: validate_id }),
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
  }, [router.query]);
  return (
    <Page message={message}></Page>
  )

  function Page(props) {
    return (
      <div className={styles.container}>
        <div className='pb-6'>
          <Icon></Icon>
        </div>
          <div className="text-center bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
            {props.message}
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
}