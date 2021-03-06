import React, { useState, useEffect } from "react";
import { FormInputBlock } from "../../../component/elements/form-input";
import Button from "../../../component/elements/button";
import styles from "../../../styles/Home.module.css";
import Icon from "../../../component/elements/Icon";
import { Loading } from "notiflix/build/notiflix-loading-aio";
import Link from "next/link";
import FromTitle from "../../../component/elements/form-title";

export default function Reset(props) {
  const [username, setUsername] = useState();
  const [email, setEmail] = useState();
  const [error, setError] = useState();
  const [finish, setFinish] = useState(false);

  const handleKeyPress = async (event) => {
    if (event.key == "Enter") {
      await validate();
    }
  };

  useEffect(() => {
    document.addEventListener("keyup", handleKeyPress);
    return () => {
      document.removeEventListener("keyup", handleKeyPress);
    };
  });

  if (!finish) {
    return (
      <div className={styles.container}>
        <Icon></Icon>
        <div className="w-full max-w-xs pt-10">
          <form className="bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
            {/* Username block */}
            <FromTitle title="username" />
            <FormInputBlock
              category="username"
              value={username}
              onChange={setUsername}
              warning={error}
            ></FormInputBlock>
            {/* Email block */}
            <FromTitle title="email" />
            <FormInputBlock
              category="email"
              value={email}
              onChange={setEmail}
            ></FormInputBlock>
            {/* Confirm */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <div onClick={validate}>
                <Button text="Confirm"></Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  } else {
    return (
      <div className={styles.container}>
        <div className="pb-6">
          <Icon></Icon>
        </div>
        <div className="text-center bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
          A verification link will be sent to you via email. <br></br>
          Click into the link within 24 hours to reset your password.
          <div className="text-center pt-4">
            <Link href="/login">
              <a>
                <Button text="Return"></Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function validate() {
    // Clear all errors first
    setError();
    // Check any unfilled fields
    if (!username || !email) {
      setError("Username or email must not be empty");
      return;
    }
    // Set new password
    Loading.circle({ svgColor: "#283593" });
    try {
      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        body: JSON.stringify({ username: username, email: email }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.message);
      } else {
        setFinish(true);
      }
      Loading.remove();
    } catch (error) {
      setError("Unknown error occurred.");
      Loading.remove();
    }
  }
}
