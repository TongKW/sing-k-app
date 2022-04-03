import React, { useState, useEffect } from "react";
import HomePage from "../component/wrapper/HomePage";
import { useRouter } from "next/router";
import firebase from "firebase/compat/app";
import { firebaseConfig } from "../firebase/config";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Avatar,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Button,
  DialogActions,
} from "@mui/material";
import { FormInputBlock } from "../component/elements/form-input";
import PeopleIcon from "@mui/icons-material/People";
import generateRoomId from "../utils/room/generate-id";
import LoadingCircle from "../utils/inlineLoading";
import { TapAndPlayTwoTone } from "@mui/icons-material";
import getUserId from "../utils/jwt/decrypt";

export default function Home() {
  const [username, setUsername] = useState("");
  const app = firebase.initializeApp(firebaseConfig);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);
  return (
    <HomePage>
      <div className="flex-1 p-10 text-2xl font-bold">
        Welcome back, {username}!
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
            my: 5,
          }}
        >
          <CreateRoomButton app={app} username={username} />
          <JoinRoomButton app={app} username={username} />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 3,
            py: 1,
            border: 1,
            borderRadius: 2,
          }}
        >
          <Box>Current streaming room: 4</Box>
          <Box mt={2} />
          <CurrentStreamRoom
            id="test"
            image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9pBh-vAxx703zgbQBqOUEREnogEa23F_xFw&usqp=CAU"
            hostname="abc"
            audience="3"
          />
        </Box>
      </div>
    </HomePage>
  );
}

const UserAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => ["src"].includes(prop),
})(({ src, theme }) => ({
  width: theme.spacing(6),
  height: theme.spacing(6),
  border: `3px solid ${theme.palette.background.paper}`,
  src: src,
}));

function CreateRoomButton(props) {
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [checkMicOpen, setCheckMicOpen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [canEnterRoom, setCanEnterRoom] = useState(false);
  const [userIdError, setUserIdError] = useState(false);
  const [roomType, setRoomType] = useState();
  const [roomid, setRoomId] = useState();
  const db = getFirestore(props.app);
  const router = useRouter();

  const handleCreateRoomOpen = () => setCreateRoomOpen(true);

  const handleCreateRoomClose = () => setCreateRoomOpen(false);

  const handleCheckMicOpen = () => setCheckMicOpen(true);
  const handleCheckMicClose = () => setCheckMicOpen(false);
  useEffect(() => {
    if (canEnterRoom || userIdError) {
      handleCheckMicClose();
      if (canEnterRoom) {
        router.push(`/room/${roomid}`);
      } else {
        router.push("/login");
      }
    }
  }, [canEnterRoom, userIdError]);

  const handleEnterCreatedRoom = async () => {
    const userId = await getUserId();
    if (userId !== null) {
      await setDoc(doc(db, "rooms", roomid), {
        creator: userId,
        queue: [],
        type: roomType,
      });
      //   await collection(db, "rooms")
      //     .doc(roomid)
      //     .collection("RTCinfo")
      //     .doc(userId)
      //     .set({});

      setCanEnterRoom(true);
    } else {
      setUserIdError(true);
    }
  };

  const createRoom = async () => {
    const roomid = await generateRoomId();
    setRoomId(roomid);
    handleCreateRoomClose();
    handleCheckMicOpen();
  };

  const createStreamingRoom = async () => {
    const roomType = "streaming";
    setRoomType(roomType);
    await createRoom(roomType);
  };

  const createPrivateRoom = async () => {
    const roomType = "private";
    setRoomType(roomType);
    await createRoom(roomType);
  };

  return (
    <>
      <button
        className="w-full h-20 bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 mx-10 text-xs rounded focus:outline-none focus:shadow-outline"
        type="button"
        onClick={handleCreateRoomOpen}
      >
        <font size="3">Create room</font>
      </button>
      <CreateRoomDialog
        open={createRoomOpen}
        close={handleCreateRoomClose}
        clickStreaming={createStreamingRoom}
        clickPrivate={createPrivateRoom}
      />
      <CheckMicDialog
        open={checkMicOpen}
        close={handleEnterCreatedRoom}
        setLocalStream={setLocalStream}
      />
    </>
  );
}

function CreateRoomDialog(props) {
  return (
    <Dialog open={props.open} onClose={props.close}>
      <DialogTitle>Choose Type: </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <StreamRoomButton onClick={props.clickStreaming} />
          <PrivateRoomButton onClick={props.clickPrivate} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function StreamRoomButton(props) {
  return (
    <Box>
      <button
        className="w-30 h-20 bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 mx-5 text-xs rounded focus:outline-none focus:shadow-outline"
        type="button"
        onClick={props.onClick}
      >
        <font size="3">Stream room</font>
      </button>
    </Box>
  );
}

function PrivateRoomButton(props) {
  return (
    <Box>
      <button
        className="w-30 h-20 bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 mx-5 text-xs rounded focus:outline-none focus:shadow-outline"
        type="button"
        onClick={props.onClick}
      >
        <font size="3">Private room</font>
      </button>
    </Box>
  );
}

function JoinRoomButton(props) {
  const [enterRoomIdOpen, setEnterRoomIdOpen] = useState(false);
  const [checkMicOpen, setCheckMicOpen] = useState(false);
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [roomid, setRoomid] = useState();
  const [roomidError, setRoomidError] = useState();
  const [localStream, setLocalStream] = useState(null);
  const [canEnterRoom, setCanEnterRoom] = useState(false);
  const [userIdError, setUserIdError] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);

  const db = getFirestore(props.app);
  const router = useRouter();

  useEffect(() => {
    if (localStream !== null) {
      console.log("Got the media stream!");
      console.log(localStream);
    }
  }, [localStream]);

  useEffect(() => {
    if (canEnterRoom || userIdError) {
      handleCheckMicClose();
      if (canEnterRoom) {
        router.push(`/room/${roomid}`);
      } else {
        router.push("/login");
      }
    }
  }, [canEnterRoom, userIdError]);

  const handleEnterRoomIdOpen = () => setEnterRoomIdOpen(true);

  const handleEnterRoomIdClose = () => setEnterRoomIdOpen(false);

  const handleCheckMicOpen = () => setCheckMicOpen(true);

  const handleCheckMicClose = () => setCheckMicOpen(false);

  const handleWaitingOpen = async () => {
    const queuePositionResult = await appendUserIdToQueue();
    if (queuePositionResult !== null) {
      setQueuePosition(queuePositionResult);
      setWaitingOpen(true);
    }
  };

  const handleWaitingClose = () => setWaitingOpen(false);

  const handleGetLocalStream = () => {
    handleCheckMicClose();
    handleWaitingOpen();
  };

  const validateRoomId = (roomid) => {
    const findRoomIdInFirebase = async () => await queryFireBase(roomid);
    findRoomIdInFirebase().then((result) => {
      if (result) {
        handleEnterRoomIdClose();
        handleCheckMicOpen();
        setRoomid(roomid);
      } else setRoomidError("Room ID not found");
    });
  };

  const queryFireBase = async (roomid) => {
    const roomsSnapshot = await getDocs(collection(db, "rooms"));
    const roomIdExists = roomsSnapshot.docs
      .map((doc) => doc.id)
      .some((roomsSnapshotId) => roomsSnapshotId === roomid);
    return roomIdExists;
  };

  const appendUserIdToQueue = async () => {
    const userId = await getUserId();
    if (userId !== null) {
      const roomSnapshot = await getDoc(doc(db, "rooms", roomid));
      const newQueue = [...roomSnapshot.data().queue, userId];
      await updateDoc(room, { queue: newQueue });
      return newQueue.indexOf(userId);
    } else {
      setUserIdError(true);
      return null;
    }
  };

  const joinRoom = async () => {
    //TODO: push the userId to firebase in a queue
    //router.push('/room/'+roomid);
  };

  return (
    <>
      <button
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 mx-10 text-xs rounded focus:outline-none focus:shadow-outline"
        type="button"
        onClick={handleEnterRoomIdOpen}
      >
        <font size="3">Join room</font>
      </button>
      <EnterRoomIdDialog
        open={enterRoomIdOpen}
        close={handleEnterRoomIdClose}
        warning={roomidError}
        validate={validateRoomId}
      />
      <CheckMicDialog
        open={checkMicOpen}
        close={handleGetLocalStream}
        setLocalStream={setLocalStream}
      />
      <WaitingDialog
        roomid={roomid}
        open={waitingOpen}
        position={queuePosition}
        close={handleWaitingClose}
      />
    </>
  );
}

function EnterRoomIdDialog(props) {
  const [roomid, setRoomid] = useState();
  return (
    <Dialog open={props.open} onClose={props.close}>
      <DialogTitle>Enter Room ID: </DialogTitle>
      <DialogContent>
        <FormInputBlock
          category="Room ID"
          value={roomid}
          onChange={setRoomid}
          warning={props.warning}
        />
        <DialogActions>
          <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
            <button
              className="bg-indigo-700 hover:bg-indigo-800 text-white py-2 px-4 text-xs rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => props.validate(roomid.trim())}
            >
              Confirm
            </button>
          </Box>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

function CheckMicDialog(props) {
  useEffect(() => {
    if (props.open) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((localStream) => {
          props.setLocalStream(localStream);
          props.close();
        })
        .catch(props.close);
    }
  });
  return (
    <Dialog
      open={props.open}
      onClose={props.close}
      aria-labelledby="check-audio-dialog-title"
      aria-describedby="check-audio-dialog-description"
    >
      <DialogTitle aria-labelledby="check-audio-dialog-title">
        Checking your audio source...
      </DialogTitle>
      <DialogContent>
        <DialogContentText aria-describedby="check-audio-dialog-description">
          Please permit the use of microphone...
        </DialogContentText>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <LoadingCircle />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function WaitingDialog(props) {
  return (
    <Dialog
      open={props.open}
      onClose={props.close}
      aria-labelledby="waiting-dialog-title"
      aria-describedby="waiting-dialog-description"
    >
      <DialogTitle aria-labelledby="check-audio-dialog-title">
        {`Waiting to enter room ${props.roomid}...`}
      </DialogTitle>
      <DialogContent>
        <DialogContentText aria-describedby="waiting-dialog-description">
          We are connecting your audio with other users. Please be patient!
        </DialogContentText>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <DialogContentText aria-describedby="waiting-dialog-description">
            Your current position: {props.position + 1}
          </DialogContentText>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <LoadingCircle />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function CurrentStreamRoom(props) {
  const router = useRouter();

  const handleJoinRoom = () => {
    router.push("/room/" + props.id);
  };

  const StyledButton = styled(Button)({
    textTransform: "none",
  });

  return (
    <StyledButton width="100%" textTransform="none" onClick={handleJoinRoom}>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          pl: 1,
          backgroundColor: "#ffffff",
          borderRadius: 2,
          my: 1,
        }}
      >
        <Typography color="#000000" textAlign="left">
          Room ID: {props.id}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
          >
            <UserAvatar src={props.image} />
            <Typography color="#000000">{props.hostname}</Typography>
          </Box>
          <Box mr={1} color="#000000">
            <Typography>
              <PeopleIcon /> {props.audience}
            </Typography>
          </Box>
        </Box>
      </Box>
    </StyledButton>
  );
}
