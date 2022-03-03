import React, { useState, useEffect } from "react";
import HomePage from "../component/wrapper/HomePage";
import FromTitle from "../component/elements/form-title";
import { FormInputBlock } from "../component/elements/form-input";
import Button from "../component/elements/button";
import { Loading } from "notiflix/build/notiflix-loading-aio";
import pwValidateSetError from "../utils/validate-password-format";

export default function ChangePassword() {
  return (
    <HomePage href="change-password">
      <div className="flex-1 p-10 text-2xl font-bold">
        Change Password
        <ChangePasswordPage />
      </div>
    </HomePage>
  );
}

function ChangePasswordPage() {
  const [oldPw, setOldPw] = useState();
  const [newPw, setNewPw] = useState();
  const [confirmedNewPw, setConfirmedNewPw] = useState();
  const [oldPwError, setOldPwError] = useState();
  const [newPwError, setNewPwError] = useState();
  const [dupError, setDupError] = useState();
  const [changedPwStatus, setChangedPwStatus] = useState(false);
  if (!changedPwStatus) {
    return (
      <div className="grid grid-cols-12 gap-8" style={{ height: "100%" }}>
        <div className="flex flex-col justify-center col-start-4 col-span-6">
          <form className="flex flex-col space-y-4">
            <FromTitle title="Old Password" />
            <FormInputBlock
              category="password"
              onChange={setOldPw}
              warning={oldPwError}
            />
            <FromTitle title="New Password" />
            <FormInputBlock
              category="password"
              onChange={setNewPw}
              warning={newPwError}
            />
            <FromTitle title="Confirmed New Password" />
            <FormInputBlock
              category="confirm password"
              onChange={setConfirmedNewPw}
              warning={dupError}
            />
            <div className="flex items-center justify-between">
              <div onClick={validate}>
                <Button text="Confirm" />
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  } else {
    return (
      <>
        <ChangedPasswordPage />
      </>
    );
  }
  async function checkUserOldPw(oldPw) {
    const username = localStorage.getItem("username");
    const requestBody = { username: username, password: oldPw };
    const errorResponse = { success: false, error: null };
    let response;
    try {
      response = await fetch("/api/users/auth", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return errorResponse;
    }
    try {
      const data = await response.json();
      return { success: data.success, error: data.message };
    } catch (error) {
      return errorResponse;
    }
  }

  async function decryptSessionToken() {
    const token = localStorage.getItem("token");
    const requestBody = { token: token };
    const errorResponse = { success: false, error: null };
    let response;
    try {
      response = await fetch("/api/jwt/decrypt", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return errorResponse;
    }
    try {
      const data = await response.json();
      return { success: data.body.id, error: null };
    } catch (error) {
      return errorResponse;
    }
  }

  async function changePw(userId, newPw) {
    const requestBody = { id: userId, password: newPw };
    const response = await fetch("/api/users/update", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });
    try {
      const data = await response.json();
      return { success: data.success, error: data.message };
    } catch (error) {
      return { success: false, error: null };
    }
  }

  async function changePwInterface(newPw) {
    const decryptionResult = await decryptSessionToken();
    if (!decryptionResult.success) return decryptionResult;
    const userId = decryptionResult.success;
    return await changePw(userId, newPw);
  }

  async function validate() {
    setOldPwError();
    setNewPwError();
    setDupError();

    Loading.circle({ svgColor: "#283593" });
    const oldPwCorrect = await checkUserOldPw(oldPw);
    Loading.remove();

    if (!oldPwCorrect.success) {
      if (oldPwCorrect.error === null) alert("Unknown error occurs");
      else setOldPwError("Password is not correct");
      return;
    } else if (oldPw === newPw) {
      setNewPwError("New password should not be the same as the old password");
      setOldPwError();
      return;
    } else if (pwValidateSetError(newPw, setNewPwError, setOldPwError)) {
      return;
    } else if (newPw !== confirmedNewPw) {
      setDupError("Confirmed New Password is not equal to New Password");
      setOldPwError();
      setNewPwError();
      return;
    } else {
      Loading.circle({ svgColor: "#283593" });
      let uploadedPw;
      try {
        uploadedPw = await changePwInterface(newPw);
        console.log("uploadedPw = ", uploadedPw);
      } catch (error) {
        alert(`Unknown error occurs: ${error}`);
        return;
      } finally {
        Loading.remove();
      }
      if (!uploadedPw.success) {
        alert("Unknown error occurs");
        return;
      } else setChangedPwStatus(true);
    }
  }
}

function ChangedPasswordPage() {
  return (
    <div className="flex flex-row justify-center">
      <div>Successfully changed password!</div>
    </div>
  );
}
