import React, { useState, useEffect, useRef } from "react";
import Router, { useRouter } from "next/router";
import HomePage from "../../component/wrapper/HomePage";
import firebase from "firebase/compat/app";
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  getFirestore,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { Box } from "@mui/material";
import { firebaseConfig } from "../../firebase/config";
import Button from "../../component/elements/button";
import sleep from "../../utils/sleep";
import RoomMangementPanel from "./roomManagement";
import UserUtilityPanel from "./userUtility";
import SongManagementPanel from "./songManagement";
import { otherParticipantsInfo, songInfo, commentInfo } from "./mockup";

// Peer connection global variables
var peerConnections = {};
// Existing users global variables
var existingUsers = [];

export default function Room() {
  // Routing parameter
  const router = useRouter();
  const roomId = router.query.id;

  // WebRTC info and Stream parameters for the next newcomer
  let localStream = useRef(null);

  let userInput = useRef(null);

  // Only reload when users enter/leave
  const [load, reload] = useState(Date.now());

  // Initialization indicates
  const [initialized, setInitialized] = useState(false);

  // User info
  const [username, setUsername] = useState();
  const [avatar, setAvatar] = useState();
  const [userId, setUserId] = useState();
  const [roomCreatorId, setRoomCreatorId] = useState(
    "621635d92eecb0a4b18574e4"
  );

  const [currentRoomType, setCurrentRoomType] = useState("private");
  const [isRoomCreator, setIsRoomCreator] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [echo, setEcho] = useState(50);
  const [volume, setVolume] = useState(50);
  const [otherUsersList, setOtherUsersList] = useState(otherParticipantsInfo);
  const [commentList, setCommentList] = useState(commentInfo);
  const [allSongList, setAllSongList] = useState(songInfo);

  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);

  //--test--
  console.log("Peer connection:");
  console.log(peerConnections);
  //--test--

  const handleMuteUnmute = () => {
    if (isMuted) {
      setIsMuted(false);
      console.log("Now Unmute!");
    } else {
      setIsMuted(true);
      console.log("Now mute!");
    }
  };

  const handleStartSong = () => {
    console.log("Start song!");
  };
  const handleStopSong = () => {
    console.log("Stopped song!");
  };

  const handleAddSong = (newSong) => {
    const newAllSongList = [...allSongList, newSong];
    setAllSongList(newAllSongList);
  };

  const handleDeleteSong = () => {
    //delete the last element in allSongList if it is not empty
    const newAllSongList = allSongList.slice(0, -1);
    setAllSongList(newAllSongList);
  };

  const handleEcho = (event) => {
    setEcho(event.target.value);
  };

  const handleVolume = (event) => {
    setVolume(event.target.value);
  };

  const handleAddComment = (commentText) => {
    const newComment = {
      userName: localStorage.getItem("username"),
      time: Date(),
      text: commentText,
      isSystem: false,
    };
    const newCommentList = [...commentList, newComment];
    setCommentList(newCommentList);
  };
  function handleMoveSong(prevIndex, currentIndex) {
    //swap the two elements inside a list based on prevIndex and currentIndex
    if (currentIndex === allSongList.length) return;
    else if (currentIndex === -1) return;
    let newAllSongList = [...allSongList];
    newAllSongList[prevIndex] = allSongList[currentIndex];
    newAllSongList[currentIndex] = allSongList[prevIndex];
    setAllSongList(newAllSongList);
  }

  // useEffect(() => {
  //   if (!initialized) {
  //     //TODO: Update the firebase when the song list is changed
  //   }
  // }, [allSongList]);

  // Get response of user info and display from local storage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = decrypt_jwt(token).body;
    async function decrypt_jwt(token) {
      const response = await fetch("/api/jwt/decrypt", {
        method: "POST",
        body: JSON.stringify({ token: token }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.authorized) {
        const user = data.body;
        setUsername(user.username);
        setAvatar(user.avatar);
        setUserId(user.id);
      } else {
        // Unauthorized user or jwt expired
        // Prompt to login page
        router.push("/login");
      }
    }
  }, [router]);

  // Initialize audio stream and WebRTC
  // Get peer WebRTC info and connect
  // Only run once after roomId is get
  useEffect(() => {
    const db = getFirestore();
    const allUserDoc = collection(db, `rooms/${roomId}/RTCinfo`);
    const calleeDoc = collection(
      db,
      `rooms/${roomId}/RTCinfo/${userId}/callees`
    );

    if (initialized || !roomId || !userId) return;
    initialize();

    // Initialize for first time joining the room
    async function initialize() {
      console.log("COUNT: initalize() is called");
      setInitialized(true);

      // Setup audio
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      // Get Firebase
      const roomDoc = doc(db, "rooms", roomId);
      const roomSnapshot = await getDoc(roomDoc);
      const roomType = roomSnapshot.data().type;
      setCurrentRoomType(roomType);

      const allUserSnapshot = await getDocs(allUserDoc);

      allUserSnapshot.forEach(async (docSnapshot) => {
        if (docSnapshot.id !== userId) {
          existingUsers.push(docSnapshot.id);
          const newUserId = docSnapshot.id;
          // Create one WebRTC Peer Connection and update Firestore for every other user
          await initPeerConnection(newUserId);
        }
      });

      //TODO: Add a new user to the otherUsersList

      // Write Firebase to update offer
      await createNewUserFirestore();
    }

    // Listen for any joined user
    onSnapshot(calleeDoc, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        // Get new user info
        const newUserDoc = change.doc;
        const newUserId = newUserDoc.id;
        if (newUserId === userId) return;
        // If a new user joined, connect with WebRTC
        if (change.type === "added" || change.type === "modified") {
          createNewPeerConnection(newUserId);
          //await initPeerConnection(newUserId);
          const fromICEcandidate = newUserDoc.data().ICEcandidate;
          const fromRTCoffer = newUserDoc.data().RTCoffer;
          if (fromRTCoffer) {
            console.log("PROCESS 1.5");
            // If created the connection first and got answer back:
            // 1. if pc.currentRemote is null => setRemote
            if (existingUsers.includes(newUserId)) {
              if (!peerConnections[newUserId].pc.remoteDescription) {
                console.log("PROCESS 2");
                const desc = new RTCSessionDescription(fromRTCoffer);
                await peerConnections[newUserId].pc.setRemoteDescription(desc);
                console.log(`[system] ${newUserId} joined the room.`);
                console.log(peerConnections);
              }
            }
            // If other created the connection first:
            // 1. setRemote
            // 2. createOffer
            // 3. setLocal
            if (!existingUsers.includes(newUserId)) {
              console.log("PROCESS 3");
              await connectNewUser(newUserId, fromRTCoffer);
            }

            if (fromICEcandidate) {
              await addICEcandidate(newUserId, fromICEcandidate);
            }
            /*
            if (!fromICEcandidate || !fromRTCoffer) return;
            // Connect
            await connectNewUser(newUserId, fromICEcandidate, fromRTCoffer);
            */
            // Force rerender on the UI
            reload();
          }
        }
      });
    });

    // Listen for any left user
    onSnapshot(allUserDoc, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        // If an user left, delete info and close the WebRTC connection
        if (change.type === "removed") {
          const newUserDoc = change.doc;
          const leftUserId = newUserDoc.id;
          if (leftUserId === userId) return;
          await deleteDoc(
            doc(db, `rooms/${roomId}/RTCinfo/${userId}/callees/${leftUserId}`)
          );
          console.log(`[system] ${leftUserId} left the room.`);
          // Close WebRTC connection
          peerConnections[leftUserId].pc.close();
          // delete user info
          delete peerConnections[leftUserId];
          // Force rerender on the UI
          reload();
        }
      });
    });

    //return () => {}

    // Below are the wrapped functions ONLY used in this useEffect

    // Initialize Peer Connection
    async function initPeerConnection(userId) {
      console.log(`COUNT: initPeerConnection() is called on ${userId}`);
      // If peer Connection has been created before, return
      if (peerConnections.hasOwnProperty(userId)) return;

      // Initialize and store new Peer Connection
      createNewPeerConnection(userId);

      // Create new Media Stream
      let remoteStream = new MediaStream();

      // Push tracks from local stream to peer connection
      localStream.current.getTracks().forEach((track) => {
        peerConnections[userId].pc.addTrack(track, localStream.current);
      });

      peerConnections[userId].pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };
      peerConnections[userId].audioStream = remoteStream;
      peerConnections[userId].mute = false;

      peerConnections[userId].pc.onicecandidate = (event) => {
        event.candidate &&
          updateConnectionData(userId, {
            ICEcandidate: event.candidate.toJSON(),
          });
      };

      // Create offer descript and set to local
      const description = await peerConnections[userId].pc.createOffer();
      const RTCoffer = {
        sdp: description.sdp,
        type: description.type,
      };
      await peerConnections[userId].pc.setLocalDescription(description);
      console.log("Peer Connection after setLocalDescription");
      console.log(peerConnections);
      console.log(peerConnections[userId].pc);

      await sleep(2000);
      await updateConnectionData(userId, { RTCoffer: RTCoffer });
      //const localDesc = peerConnections[userId].pc.localDescription;

      // Create firestore document for new user to connect to you
      await createNewUserFirestore();
    }

    // Create an user document for any user to write connection data on
    async function createNewUserFirestore() {
      const userDoc = doc(db, `rooms/${roomId}/RTCinfo/${userId}`);
      await setDoc(userDoc, {});
    }

    // Update the connection data on other's user document
    async function updateConnectionData(targetUserId, payload) {
      const calleeDoc = doc(
        db,
        `rooms/${roomId}/RTCinfo/${targetUserId}/callees/${userId}`
      );
      await setDoc(calleeDoc, payload, { merge: true });
      console.log("updated connection data:");
      console.log(payload);
    }

    async function connectNewUser(newUserId, remoteRTCoffer) {
      createNewPeerConnection(userId);
      const desc = new RTCSessionDescription(remoteRTCoffer);
      await peerConnections[newUserId].pc.setRemoteDescription(desc);
      const localRTCoffer = await peerConnections[newUserId].pc.createAnswer();
      await peerConnections[newUserId].pc.setLocalDescription(localRTCoffer);
      const offer = {
        type: localRTCoffer.type,
        sdp: localRTCoffer.sdp,
      };
      await updateConnectionData(newUserId, { RTCoffer: offer });
      console.log(`[system] ${newUserId} joined the room.`);
      console.log(peerConnections);
    }
  }, [roomId, userId, initialized]);

  // Page UI
  if (!initialized)
    return (
      <>
        <HomePage>
          <Box
            className="hide-scrollbar"
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              height: "100vh",
              background: "#ccc",
            }}
          >
            <Box sx={{ width: "23%" }}>
              <RoomMangementPanel
                roomId={roomId}
                otherUsersList={otherUsersList}
                roomCreatorId={roomCreatorId}
                currentRoomType={currentRoomType}
                isMuted={isMuted}
                handleMuteUnmute={handleMuteUnmute}
              />
            </Box>
            <Box sx={{ background: "red", width: "54%" }}>
              <UserUtilityPanel
                isMuted={isMuted}
                echo={echo}
                volume={volume}
                handleEcho={handleEcho}
                handleVolume={handleVolume}
                commentList={commentList}
                handleAddComment={handleAddComment}
              />
            </Box>
            <Box sx={{ width: "23%" }}>
              <SongManagementPanel
                allSongList={allSongList}
                currentRoomType={currentRoomType}
                isRoomCreator={isRoomCreator}
                handleStartSong={handleStartSong}
                handleStopSong={handleStopSong}
                handleAddSong={handleAddSong}
                handleDeleteSong={handleDeleteSong}
                handleMoveSong={handleMoveSong}
              />
            </Box>
          </Box>
        </HomePage>
      </>
    );
  return (
    <>
      <HomePage>
        <div style={{ display: "none" }}>
          <div className="flex-1 p-10 text-2xl font-bold">
            Room id: {roomId}
          </div>
          {Object.keys(peerConnections).map((userId) => (
            <span key={userId}>
              <h3>{userId}</h3>
              <video id={userId} autoPlay playsInline></video>
            </span>
          ))}
          <span>
            <h3>Callback</h3>
            <video id="callbackAudio" autoPlay playsInline></video>
          </span>
          <div onClick={connectAudio}>
            <Button text="Connect Audio" />
          </div>
          <div onClick={disconnectAudio}>
            <Button text="Disconnect Audio" />
          </div>
          <div onClick={leave}>
            <Button text="Leave" />
          </div>
        </div>
      </HomePage>
      <div
        className="flex-1 p-10 text-2xl font-bold"
        style={{ width: "100%", height: "900px" }}
      >
        <RoomMangementPanel
          roomId={roomId}
          otherUsersList={otherUsersList}
          roomCreatorId={roomCreatorId}
          currentRoomType={currentRoomType}
          isMuted={isMuted}
          handleMuteUnmute={handleMuteUnmute}
        />
        {/* <UserUtilityPanel
          isRoomCreator={isRoomCreator}
          otherUsersList={otherUsersList}
          isMuted={isMuted}
        />

        <SongManagementPanel
          allSongList={allSongList}
          currentRoomType={currentRoomType}
          isRoomCreator={isRoomCreator}
        /> */}
      </div>
    </>
  );

  function connectAudio() {
    console.log("connecting Audio");
    Object.keys(peerConnections).map((userId) => {
      const remoteAudio = document.getElementById(userId);
      remoteAudio.srcObject = peerConnections.audioStream;
    });
    const callbackAudio = document.getElementById("callbackAudio");
    //callbackAudio.srcObject = localStream.current;
  }

  function disconnectAudio() {
    console.log("Disconnecting Audio");
    Object.keys(peerConnections).map((userId) => {
      const remoteAudio = document.getElementById(userId);
      remoteAudio.srcObject = null;
    });
    const callbackAudio = document.getElementById("callbackAudio");
    callbackAudio.srcObject = null;
  }

  async function leave() {
    await unsubscribe();
    const db = getFirestore();
    // remove user in Firestore
    const calleesDoc = collection(
      db,
      `rooms/${roomId}/RTCinfo/${userId}/callees`
    );
    /*
    const calleesDocSnapshot = await getDocs(calleesDoc);
    calleesDocSnapshot.forEach(async (docSnapshot) => {
      if (docSnapshot === undefined) return;
      await deleteDoc(docSnapshot.doc);
    });
    */
    await deleteDoc(doc(db, `rooms/${roomId}/RTCinfo/${userId}`));
    Router.push("/");
  }

  async function unsubscribe() {
    const db = getFirestore();
    const allUserDoc = collection(db, `rooms/${roomId}/RTCinfo`);
    const calleeDoc = collection(
      db,
      `rooms/${roomId}/RTCinfo/${userId}/callees`
    );
    onSnapshot(allUserDoc, () => {});
    onSnapshot(calleeDoc, () => {});
  }

  async function addICEcandidate(newUserId, ICEcandidate) {
    console.log("addICEcandidate:");
    console.log(ICEcandidate);
    const candidate = new RTCIceCandidate(ICEcandidate);
    await peerConnections[newUserId].pc.addIceCandidate(candidate);
  }

  function createNewPeerConnection(userId) {
    if (peerConnections.hasOwnProperty(userId)) return;
    peerConnections[userId] = {};
    peerConnections[userId].pc = new RTCPeerConnection(servers);
  }

  function logDescState(userId) {
    if (!peerConnections.hasOwnProperty(userId)) {
      console.log(`Description state for ${userId}`);
      console.log("Remote Desc: null");
      console.log("Local Desc : null");
      return;
    }
    const remoteDesc = peerConnections.pc.remoteDescription;
    const localDesc = peerConnections.pc.localDescription;
    console.log(`Description state for ${userId}`);
    console.log(
      `Remote Desc: ${remoteDesc ? remoteDesc.sdp.slice(9, 20) : "null"}`
    );
    console.log(
      `Local Desc : ${localDesc ? localDesc.sdp.slice(9, 20) : "null"}`
    );
  }

  function logAllDescState() {
    console.log("Log All Desc State:");
    for (const userId of Object.keys(peerConnections)) {
      logDescState(userId);
    }
  }
}

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};
