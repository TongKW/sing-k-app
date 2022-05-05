import React, { useState, useEffect } from "react";
import HomePage from "../component/wrapper/HomePage";
import FromTitle from "../component/elements/form-title";
import { FormInputBlock } from "../component/elements/form-input";
import Button from "../component/elements/button";
import { Loading } from "notiflix/build/notiflix-loading-aio";
import pwValidateSetError from "../utils/validate-password-format";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";

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

// This component renders the change password page
function ChangePasswordPage() {
  const [oldPw, setOldPw] = useState();
  const [newPw, setNewPw] = useState();
  const [confirmedNewPw, setConfirmedNewPw] = useState();
  const [oldPwError, setOldPwError] = useState();
  const [newPwError, setNewPwError] = useState();
  const [dupError, setDupError] = useState();
  const [changedPwSuccessOpen, setChangedPwSuccessOpen] = useState(false);

  // For a better UX, we have added the event listener callback to check
  // whether the user input key is Enter. If yes, then the "change password" function
  // should be invoked.
  const handleKeyPress = async (event) => {
    if (event.key == "Enter") {
      if (!changedPwSuccessOpen) {
        await validate();
      }
    }
  };

  useEffect(() => {
    //Adding event listener to catch keyup events
    document.addEventListener("keyup", handleKeyPress);
    return () => {
      document.removeEventListener("keyup", handleKeyPress);
    };
  });
  return (
    <>
      <div className="grid grid-cols-12 gap-8" style={{ height: "100%" }}>
        <div className="flex flex-col justify-center col-start-4 col-span-6">
          <form className="flex flex-col space-y-4">
            <FromTitle title="Old Password" />
            <FormInputBlock
              value={oldPw}
              category="password"
              onChange={setOldPw}
              warning={oldPwError}
            />
            <FromTitle title="New Password" />
            <FormInputBlock
              value={newPw}
              category="password"
              onChange={setNewPw}
              warning={newPwError}
            />
            <FromTitle title="Confirmed New Password" />
            <FormInputBlock
              value={confirmedNewPw}
              category="confirm password"
              onChange={setConfirmedNewPw}
              warning={dupError}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <div onClick={validate}>
                <Button text="Confirm" />
              </div>
            </div>
          </form>
        </div>
      </div>
      <SuccessDialog
        open={changedPwSuccessOpen}
        close={() => setChangedPwSuccessOpen(false)}
      />
    </>
  );

  // This is a function to check whether the user old password is correct
  async function checkUserOldPw(oldPw) {
    const username = localStorage.getItem("username");
    const requestBody = { username: username, password: oldPw };
    const errorResponse = { success: false, error: null };
    let response;
    //fetch the api
    try {
      response = await fetch("/api/users/auth", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      // if fetch unsuccessful
      return errorResponse;
    }
    // if fetch successful, wait to parse the response from JSON to object
    try {
      const data = await response.json();
      return { success: data.success, error: data.message };
    } catch (error) {
      return errorResponse;
    }
  }

  //this is a function to decrypt the JWT from the client side on the backend
  // to check whether there is sufficient authorization for the request sender
  // to change the password
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

  //this function is to change the password from the client side. Once the
  // user identity is checked to be authorized, then the update function
  // will be invoked
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

  //An abstracted interface to change the password
  async function changePwInterface(newPw) {
    const decryptionResult = await decryptSessionToken();
    if (!decryptionResult.success) return decryptionResult;
    const userId = decryptionResult.success;
    return await changePw(userId, newPw);
  }

  //validate whether the change password event is successful.
  async function validate() {
    setOldPwError();
    setNewPwError();
    setDupError();

    Loading.circle({ svgColor: "#283593" });
    const oldPwCorrect = await checkUserOldPw(oldPw);
    Loading.remove();

    if (newPw !== confirmedNewPw) {
      setDupError("Confirmed New Password is not equal to New Password");
      setOldPwError();
      setNewPwError();
      return;
    } else if (!oldPwCorrect.success) {
      if (oldPwCorrect.error === null) alert("Unknown error occurs");
      else setOldPwError("Password is not correct");
      return;
    } else if (oldPw === newPw) {
      setNewPwError("New password should not be the same as the old password");
      setOldPwError();
      return;
    } else if (pwValidateSetError(newPw, setNewPwError, setOldPwError)) {
      return;
    } else {
      Loading.circle({ svgColor: "#283593" });
      let uploadedPw;
      try {
        uploadedPw = await changePwInterface(newPw);
      } catch (error) {
        alert(`Unknown error occurs: ${error}`);
        return;
      } finally {
        Loading.remove();
      }
      if (!uploadedPw.success) {
        alert("Unknown error occurs");
        return;
      } else setChangedPwSuccessOpen(true);
    }
  }
}

function SuccessDialog(props) {
  const handleKeyPress = async (event) => {
    if (event.key == "Enter") {
      props.close();
    }
  };

  useEffect(() => {
    document.addEventListener("keyup", handleKeyPress);
    return () => {
      document.removeEventListener("keyup", handleKeyPress);
    };
  });
  return (
    <Dialog open={props.open}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <DialogTitle>Success</DialogTitle>
      </Box>
      <DialogContent>
        <DialogContentText>Changed Password Successfully!</DialogContentText>
        <DialogActions>
          <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
            <button
              className="bg-indigo-700 hover:bg-indigo-800 text-white py-2 px-4 text-xs rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={props.close}
            >
              Ok
            </button>
          </Box>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
