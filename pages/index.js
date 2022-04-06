import React, { useState, useEffect, useRef } from "react";
import HomePage from "../component/wrapper/HomePage";
import { useRouter } from "next/router";
import firebase from "firebase/compat/app";
import { firebaseConfig } from "../firebase/config";
import {
  getFirestore,
  onSnapshot,
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
import { getUserId, setUsernameAvatar } from "../utils/jwt/decrypt";
import sleep from "../utils/sleep"



export default function Home() {
  const [username, setUsername] = useState("");
  const [roomInfos, setRoomInfos] = useState([]);
  const app = firebase.initializeApp(firebaseConfig);
  const db = getFirestore();

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
    const unsub = onSnapshot(collection(db, "rooms"), async (snapshot) => {
      const roomInfos = await Promise.all(snapshot.docs.map(async (doc) => {
        const userDoc = collection(db, `rooms/${doc.id}/RTCinfo`);
        const userSnapshot = await getDocs(userDoc);

        return {
          username: doc.data().creator,
          type: doc.data().type,
          userAvatar: doc.data().creatorAvatar,
          roomId: doc.id,
          numberOfParticipants: userSnapshot.size,
        };
      }));
      const publicRoomInfos = roomInfos.filter(roomInfo => roomInfo.type === "streaming");
      setRoomInfos(publicRoomInfos);
    });
    return () => unsub();
  }, [db]);
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
          <CreateRoomButton />
          <JoinRoomButton />
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
          <Box>Current streaming room: {roomInfos.length}</Box>
          <Box mt={2} />
          {roomInfos.map((roomInfo, index) => (
            <CurrentStreamRoom
              key={index}
              id={roomInfo.roomId}
              image={roomInfo.userAvatar}
              hostname={roomInfo.username}
              audience={roomInfo.numberOfParticipants}
            />
          ))}
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
  const [creatorName, setCreatorName] = useState();
  const [creatorAvatar, setCreatorAvatar] = useState();
  const [userId, setUserId] = useState();
  const [canEnterRoom, setCanEnterRoom] = useState(false);
  const [userIdError, setUserIdError] = useState(false);
  const [roomType, setRoomType] = useState();
  const [roomId, setRoomId] = useState();
  const db = getFirestore();
  const router = useRouter();

  const handleCreateRoomOpen = () => setCreateRoomOpen(true);

  const handleCreateRoomClose = () => setCreateRoomOpen(false);

  const handleCheckMicOpen = () => setCheckMicOpen(true);
  const handleCheckMicClose = () => setCheckMicOpen(false);

  useEffect(() => {
    if (canEnterRoom || userIdError) {
      handleCreateRoomClose();
      handleCheckMicClose();
      if (canEnterRoom) {
        localStorage.setItem('roomId', roomId);
        window.open(`/room/${roomId}`);
      } else {
        router.push("/login");
      }
    }
  }, [canEnterRoom, roomId, router, userIdError]);

  const handleEnterCreatedRoom = async () => {
    console.log(
      "handleEnterCreatedRoom [line 149-155]: setDoc creator, creatorAvatar, queue, type"
    );
    await setDoc(doc(db, "rooms", roomId), {
      creator: creatorName,
      creatorAvatar: creatorAvatar,
      creatorId: userId,
      queue: [],
      type: roomType,
    });
    console.log(
      "handleEnterCreatedRoom [line 159-160]: setDoc rooms/roomId/RTCinfo/userId"
    );
    await setDoc(doc(db, `rooms/${roomId}/RTCinfo/${userId}`), {});
    await sleep(2000);
    setCanEnterRoom(true);
  };

  const createRoom = async () => {
    const roomId = await generateRoomId();
    const userId = await setUsernameAvatar(setCreatorName, setCreatorAvatar);
    if (userId === null) {
      setUserIdError(true);
      return;
    }
    setUserId(userId);
    setRoomId(roomId);
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
      <CheckMicDialog open={checkMicOpen} close={handleEnterCreatedRoom} />
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
  const [roomId, setRoomId] = useState();
  const [roomIdError, setRoomIdError] = useState();
  const [canEnterRoom, setCanEnterRoom] = useState(false);
  const [userIdError, setUserIdError] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);

  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    if (canEnterRoom || userIdError) {
      handleCheckMicClose();
      if (canEnterRoom) {
        unsubscribeFirestore();
        localStorage.setItem('roomId', roomId);
        window.open(`/room/${roomId}`);
      } else {
        router.push("/login");
      }
    }
    function unsubscribeFirestore() {
      const db = getFirestore();
      const roomDoc = doc(db, `rooms/${roomId}`);
      onSnapshot(roomDoc, (doc) => {});
    }
  }, [canEnterRoom, roomId, router, userIdError]);

  // Firestore listener for queue change
  useEffect(() => {
    (async () => {
      if (!roomId) return;
      const userId = await getUserId();
      const db = getFirestore();
      const roomDoc = doc(db, `rooms/${roomId}`);
      onSnapshot(roomDoc, (doc) => {
        if (!doc.data()) return;
        console.log('snapshot changed:')
        console.log(doc.data());
        const newPosition = doc.data().queue.indexOf(userId)
        if (newPosition == 0) {
          setCanEnterRoom(true);
        } else {
          setQueuePosition(newPosition);
        }
      });
    })();
  }, [roomId])

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

  const validateRoomId = (roomId) => {
    const findRoomIdInFirebase = async () => await queryFireBase(roomId);
    findRoomIdInFirebase().then((result) => {
      if (result) {
        setRoomId(roomId);
        handleEnterRoomIdClose();
        handleCheckMicOpen();
      } else setRoomIdError("Room ID not found");
    });
  };

  const queryFireBase = async (roomId) => {
    const roomsSnapshot = await getDocs(collection(db, "rooms"));
    const roomIdExists = roomsSnapshot.docs
      .map((doc) => doc.id)
      .some((roomsSnapshotId) => roomsSnapshotId === roomId);
    return roomIdExists;
  };

  const appendUserIdToQueue = async () => {
    const userId = await getUserId();
    console.log(userId)
    console.log(roomId)
    if (userId !== null) {
      const roomDoc = doc(db, "rooms", roomId);
      const roomSnapshot = await getDoc(roomDoc);
      const newQueue = [...roomSnapshot.data().queue, userId];
      await updateDoc(roomDoc, { queue: newQueue });
      return newQueue.indexOf(userId);
    } else {
      setUserIdError(true);
      return null;
    }
  };

  const joinRoom = async () => {
    //TODO: push the userId to firebase in a queue
    //router.push('/room/'+roomId);
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
        warning={roomIdError}
        validate={validateRoomId}
      />
      <CheckMicDialog open={checkMicOpen} close={handleGetLocalStream} />
      <WaitingDialog
        roomId={roomId}
        open={waitingOpen}
        position={queuePosition}
        close={handleWaitingClose}
      />
    </>
  );
}

function EnterRoomIdDialog(props) {
  const [roomId, setRoomId] = useState();
  return (
    <Dialog open={props.open} onClose={props.close}>
      <DialogTitle>Enter Room ID: </DialogTitle>
      <DialogContent>
        <FormInputBlock
          category="Room ID"
          value={roomId}
          onChange={setRoomId}
          warning={props.warning}
        />
        <DialogActions>
          <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
            <button
              className="bg-indigo-700 hover:bg-indigo-800 text-white py-2 px-4 text-xs rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => props.validate(roomId.trim())}
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
        .then(props.close)
        .catch(props.close);
    }
  }, [props.open]);
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
        {`Waiting to enter room ${props.roomId}...`}
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
            Your current position: {props.position}
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
    // router.push("/room/" + props.id);
  };

  const StyledButton = styled(Button)({
    textTransform: "none",
  });

  return (
    <StyledButton width="100%" texttransform="none" onClick={handleJoinRoom}>
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