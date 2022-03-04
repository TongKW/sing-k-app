import React, { useState } from "react";
import { FormInputBlock } from "../../../component/elements/form-input";
import Button from "../../../component/elements/button";
import styles from "../../../styles/Home.module.css";
import Icon from "../../../component/elements/Icon";
import { Loading } from "notiflix/build/notiflix-loading-aio";
import Link from "next/link";
import FromTitle from "../../../component/elements/form-title";
import pwValidateSetError from "../../../utils/validate-password-format";

export default function Reset(props) {
  const [password, setPassword] = useState();
  const [dupPassword, setDupPassword] = useState();
  const [error, setError] = useState();
  const [dupError, setDupError] = useState();
  const [finish, setFinish] = useState(false);
  const [msg, setMsg] = useState("Invalid link");

  if (!props.reset_id || finish) {
    return (
      <div className={styles.container}>
        <div className="pb-6">
          <Icon></Icon>
        </div>
        <div className="text-center bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
          {msg}
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
  } else {
    return (
      <div className={styles.container}>
        <Icon></Icon>
        <div className="w-full max-w-xs pt-10">
          <form className="bg-gray-500 shadow-md rounded px-8 pt-6 pb-8">
            {/* Password block */}
            <FromTitle title="new password" />
            <FormInputBlock
              category="password"
              onChange={setPassword}
              warning={error}
            ></FormInputBlock>
            {/* Duplicate Password block */}
            <FormInputBlock
              category="confirm password"
              onChange={setDupPassword}
              warning={dupError}
            ></FormInputBlock>
            {/* Confirm */}
            <div className="flex items-center justify-between">
              <div onClick={validate}>
                <Button text="Confirm"></Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  async function validate() {
    // Clear all errors first
    setDupError();
    setError();
    // Check any unfilled fields
    if (pwValidateSetError(password, setError)) return;
    if (!dupPassword) {
      setDupError("Password must not be empty");
      return;
    }
    // Check consistency
    if (password !== dupPassword) {
      setDupError("Confirm password is not the same");
      return;
    }
    // Set new password
    Loading.circle({ svgColor: "#283593" });
    try {
      const response = await fetch("/api/users/reset-password", {
        method: "PUT",
        body: JSON.stringify({ reset_id: props.reset_id, new_pw: password }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(data);

      setMsg(data.message);
      setFinish(true);

      Loading.remove();
    } catch (error) {
      console.log(error);
      setMsg("Unknown error occurred.");
      setFinish(true);
      Loading.remove();
    }
  }
}

// Tailwind classes definitions
// Title text for input form
const formTitleClass = "block text-white text-sm font-bold mb-2";
