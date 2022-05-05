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
  IconButton,
} from "@mui/material";
import { FormInputBlock } from "../component/elements/form-input";
import PeopleIcon from "@mui/icons-material/People";
import generateRoomId from "../utils/room/generate-id";
import LoadingCircle from "../utils/inlineLoading";
import { ContactPageOutlined, TapAndPlayTwoTone } from "@mui/icons-material";
import { getUserId, setUsernameAvatar } from "../utils/jwt/decrypt";
import sleep from "../utils/sleep";
import CloseIcon from "@mui/icons-material/Close";
import removeUserQueue from "../utils/room/userOffQueue";

// Home page for the user view.
export default function Home() {
  const [username, setUsername] = useState("");
  const [roomInfos, setRoomInfos] = useState([]);
  const app = firebase.initializeApp(firebaseConfig);
  const db = getFirestore();

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
    // when the firebase conenction is available, we register an event listener that
    // emit signal when the room collection in the firebase has any change
    // to re-render the UI of list of available rooms
    const unsub = onSnapshot(collection(db, "rooms"), async (snapshot) => {
      const roomInfos = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const userDoc = collection(db, `rooms/${doc.id}/RTCinfo`);
          const userSnapshot = await getDocs(userDoc);

          return {
            username: doc.data().creator,
            type: doc.data().type,
            userAvatar: doc.data().creatorAvatar,
            roomId: doc.id,
            numberOfParticipants: userSnapshot.size,
          };
        })
      );
      const publicRoomInfos = roomInfos.filter(
        (roomInfo) => roomInfo.type === "streaming"
      );
      setRoomInfos(publicRoomInfos);
    });
    //an unsubscribe function to clean up memory when the component unmounts
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

// a create room button which allow users to create a singing room on click
function CreateRoomButton() {
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [checkMicOpen, setCheckMicOpen] = useState(false);
  const [creatorName, setCreatorName] = useState();
  const [creatorAvatar, setCreatorAvatar] = useState();
  const [userId, setUserId] = useState();
  const [canEnterRoom, setCanEnterRoom] = useState(false);
  const [userIdError, setUserIdError] = useState(false);
  const [roomType, setRoomType] = useState();
  const [roomId, setRoomId] = useState();
  const [localStream, setLocalStream] = useState();
  const db = getFirestore();
  const router = useRouter();

  //whether open the create room modal dialog
  const handleCreateRoomOpen = () => setCreateRoomOpen(true);

  //whether close the create room modal dialog
  const handleCreateRoomClose = () => setCreateRoomOpen(false);

  //whether open the check user mic open modal dialog
  const handleCheckMicOpen = () => setCheckMicOpen(true);

  //whether close the check user mic open modal dialog
  const handleCheckMicClose = () => setCheckMicOpen(false);

  useEffect(() => {
    // if the user can enter the room, or there is authorization error
    if (canEnterRoom || userIdError) {
      handleCreateRoomClose();
      handleCheckMicClose();
      if (canEnterRoom) {
        localStorage.setItem("roomId", roomId);
        localStorage.setItem("_roomType", roomType);
        // window.open(`/room/${roomId}`);
        router.push(`/room/${roomId}`);
      } else {
        router.push("/login");
      }
    }
    // return () => localStream.removeTrack();
  }, [canEnterRoom, roomId, router, userIdError]);

  //when the user can enter the created room
  const handleEnterCreatedRoom = async () => {
    //update the database document with the same roomId
    await setDoc(doc(db, "rooms", roomId), {
      creator: creatorName,
      creatorAvatar: creatorAvatar,
      creatorId: userId,
      queue: [],
      type: roomType,
    });
    await setDoc(doc(db, `rooms/${roomId}/RTCinfo/${userId}`), {});
    await sleep(2000);
    setCanEnterRoom(true);
  };

  //a function when user click the create room button
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

  // if the user creates a streaming room
  const createStreamingRoom = async () => {
    const roomType = "streaming";
    setRoomType(roomType);
    await createRoom();
  };

  // if the user creates a private room
  const createPrivateRoom = async () => {
    const roomType = "private";
    setRoomType(roomType);
    await createRoom();
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

// crteate room dialog which shows chosing which type of rooms
function CreateRoomDialog(props) {
  return (
    <Dialog open={props.open}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <DialogTitle>Choose Type: </DialogTitle>
        <IconButton onClick={props.close}>
          <CloseIcon />
        </IconButton>
      </Box>
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

// component of the streaming room button
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

// component of the private room button
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

// a join room button which allow users to create a singing room on click
function JoinRoomButton() {
  const [enterRoomIdOpen, setEnterRoomIdOpen] = useState(false);
  const [roomId, setRoomId] = useState();
  const [roomIdError, setRoomIdError] = useState();
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);

  const db = getFirestore();

  const handleEnterRoomIdOpen = () => setEnterRoomIdOpen(true);

  const handleEnterRoomIdClose = () => setEnterRoomIdOpen(false);

  const handleJoinRoomOpen = () => setJoinRoomOpen(true);
  const handleJoinRoomClose = () => setJoinRoomOpen(false);

  const validateRoomId = (roomId) => {
    const findRoomIdInFirebase = async () => await queryFireBase(roomId);
    findRoomIdInFirebase().then((result) => {
      if (result) {
        setRoomId(roomId);
        handleEnterRoomIdClose();
        handleJoinRoomOpen();
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
      <JoinRoomUtilityDialog
        open={joinRoomOpen}
        roomId={roomId}
        close={handleJoinRoomClose}
      />
    </>
  );
}

function JoinRoomUtilityDialog(props) {
  const [checkMicOpen, setCheckMicOpen] = useState(false);
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [roomType, setRoomType] = useState();
  const [userId, setUserId] = useState();
  const [canEnterRoom, setCanEnterRoom] = useState(false);
  const [userIdError, setUserIdError] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);

  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    if (props.open) {
      handleCheckMicOpen();
    }
  }, [props.open]);

  useEffect(() => {
    if (props.open) {
      if (canEnterRoom || userIdError) {
        handleCheckMicClose();
        props.close();
        if (canEnterRoom) {
          unsubscribeFirestore();
          localStorage.setItem("roomId", props.roomId);
          localStorage.setItem("_roomType", roomType);
          // window.open(`/room/${props.roomId}`);
          router.push(`/room/${props.roomId}`);
        } else {
          router.push("/login");
        }
      }
      function unsubscribeFirestore() {
        const db = getFirestore();
        const roomDoc = doc(db, `rooms/${props.roomId}`);
        onSnapshot(roomDoc, (doc) => {});
      }
    }
  }, [canEnterRoom, props.open, router, userIdError]);

  // Firestore listener for queue change
  useEffect(() => {
    if (props.open) {
      (async () => {
        if (!props.roomId) return;
        const userId = await getUserId();
        setUserId(userId);
        const roomDoc = doc(db, `rooms/${props.roomId}`);
        onSnapshot(roomDoc, async (doc) => {
          if (!doc.data()) return;
          const newPosition = doc.data().queue.indexOf(userId);
          if (newPosition === 0) {
            await sleep(2000);
            setCanEnterRoom(true);
          } else {
            setQueuePosition(newPosition);
          }
        });
      })();
    }
  }, [props.open]);
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

  const handleLeaveQueueManually = async () => {
    await removeUserQueue(db, userId, props.roomId);
    handleWaitingClose();
    props.close();
  };

  const handleGetLocalStream = () => {
    handleCheckMicClose();
    handleWaitingOpen();
  };
  const appendUserIdToQueue = async () => {
    const userId = await getUserId();
    if (userId !== null) {
      const roomDoc = doc(db, "rooms", props.roomId);
      const roomSnapshot = await getDoc(roomDoc);
      setRoomType(roomSnapshot.data().type);
      const newQueue = [...roomSnapshot.data().queue, userId];
      await updateDoc(roomDoc, { queue: newQueue });
      return newQueue.indexOf(userId);
    } else {
      setUserIdError(true);
      return null;
    }
  };
  return (
    <>
      <CheckMicDialog open={checkMicOpen} close={handleGetLocalStream} />
      <WaitingDialog
        roomId={props.roomId}
        open={waitingOpen}
        position={queuePosition}
        close={handleLeaveQueueManually}
      />
    </>
  );
}

function EnterRoomIdDialog(props) {
  // const roomIdRef = useRef("");
  const [roomId, setRoomId] = useState();

  const handleClick = () => {
    props.validate(roomId);
  };

  const handleKeyPress = (event) => {
    if (event.key == "Enter") {
      handleClick();
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
        <DialogTitle>Enter Room ID: </DialogTitle>
        <IconButton onClick={props.close}>
          <CloseIcon />
        </IconButton>
      </Box>
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
              onClick={handleClick}
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
        .getUserMedia({ video: false, audio: true })
        .then((localStream) => {
          props.setLocalStream(localStream);
          props.close();
        })
        .catch(props.close);
    }
  }, [props.open]);
  return (
    <Dialog
      open={props.open}
      aria-labelledby="check-audio-dialog-title"
      aria-describedby="check-audio-dialog-description"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <DialogTitle aria-labelledby="check-audio-dialog-title">
          Checking your audio source...
        </DialogTitle>
        <IconButton onClick={props.close}>
          <CloseIcon />
        </IconButton>
      </Box>

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
      aria-labelledby="waiting-dialog-title"
      aria-describedby="waiting-dialog-description"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <DialogTitle aria-labelledby="check-audio-dialog-title">
          {`Waiting to enter room ${props.roomId}...`}
        </DialogTitle>
        <IconButton onClick={props.close}>
          <CloseIcon />
        </IconButton>
      </Box>
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
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);

  const handleJoinRoomOpen = () => setJoinRoomOpen(true);
  const handleJoinRoomClose = () => setJoinRoomOpen(false);

  const StyledButton = styled(Button)({
    textTransform: "none",
  });

  return (
    <>
      <StyledButton
        width="100%"
        texttransform="none"
        onClick={handleJoinRoomOpen}
      >
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
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
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
      <JoinRoomUtilityDialog
        open={joinRoomOpen}
        roomId={props.id}
        close={handleJoinRoomClose}
      />
    </>
  );
}
