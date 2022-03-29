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

export default function Room() {
  // Routing parameter
  const router = useRouter();
  const roomId = router.query.id;

  // WebRTC info and Stream parameters for the next newcomer
  let localStream = useRef(null);
  let pendingICEcandidates = useRef({});
  // Peer connection global variables
  let peerConnections = useRef({});
  // Existing users global variables
  let existingUsers = useRef([]);

  let userInput = useRef(null);

  // Only reload when users enter/leave
  const [value, setValue] = useState(0);

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
  console.log(peerConnections.current);
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
      username: localStorage.getItem("username"),
      time: Date(),
      text: commentText,
      isSystem: false,
    };
    const newCommentList = [...commentList, newComment];
    // Send the chat message to other users
    sendMsgAll({
      username: username,
      type: "chat",
      message: commentText,
    });
    // update own message to UI
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

  // Add listener when user is about to close the page or refresh
  useEffect(() => {
    window.onbeforeunload = async () => {
      await leave();
    };
  });

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
          existingUsers.current.push(docSnapshot.id);
          const newUserId = docSnapshot.id;
          // Create one WebRTC Peer Connection and update Firestore for every other user
          await initPeerConnection(newUserId);
        }
      });

      //TODO: Add a new user to the otherUsersList

      // Write Firebase to update offer
      await createNewUserFirestore();

      // Send user info to other users
      sendMsgAll({
        username: username,
        type: "system",
        message: `${username} has joined the room.`,
      });
      sendMsgAll({
        type: "setUser",
        username: username,
        userId: userId,
        avatar: avatar,
      });
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
          // Create new connection
          createNewPeerConnection(newUserId);
          // Initializing an empty ICE candidate queue for the new comer
          if (!pendingICEcandidates.current.hasOwnProperty(newUserId)) {
            pendingICEcandidates.current[newUserId] = [];
          }
          const fromICEcandidate = newUserDoc.data().ICEcandidate;
          const fromRTCoffer = newUserDoc.data().RTCoffer;
          if (fromRTCoffer) {
            console.log("PROCESS 1.5");

            if (
              peerConnections.current[newUserId].pc.remoteDescription === null
            ) {
              console.log(`Current remote desc:`);
              console.log(
                peerConnections.current[newUserId].pc.remoteDescription
              );
              // If created the connection first and got answer back:
              // 1. if pc.currentRemote is null => setRemote
              if (existingUsers.current.includes(newUserId)) {
                console.log("PROCESS 2");
                const desc = new RTCSessionDescription(fromRTCoffer);

                await peerConnections.current[
                  newUserId
                ].pc.setRemoteDescription(desc);

                //console.log(`[system] ${newUserId} joined the room.`);
                console.log(peerConnections.current);
              }
              // If other created the connection first:
              // 1. setRemote
              // 2. createOffer
              // 3. setLocal
              if (!existingUsers.current.includes(newUserId)) {
                console.log("PROCESS 3");
                await connectNewUser(newUserId, fromRTCoffer);

                // Send user info to other users
                sendMsgAll({
                  username: username,
                  type: "system",
                  message: `${username} has joined the room.`,
                });
                sendMsgAll({
                  username: username,
                  type: "setUser",
                  userId: userId,
                  avatar: avatar,
                });
              }
            }
            // Add all pending ICE candidates
            await handleICEqueue(newUserId);

            /*
            if (!fromICEcandidate || !fromRTCoffer) return;
            // Connect
            await connectNewUser(newUserId, fromICEcandidate, fromRTCoffer);
            */

            // Force rerender on the UI
            //setValue(value => value + 1);;
          }

          if (fromICEcandidate) {
            if (peerConnections.current[newUserId].pc.remoteDescription) {
              try {
                await addICEcandidate(newUserId, fromICEcandidate);
              } catch (error) {
                console.log(
                  `Error occurred when adding ICE candidate: ${error}`
                );
              }
            } else {
              pendingICEcandidates.current[newUserId].push(fromICEcandidate);
            }
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
          // Remove user from existingUsers.current
          if (existingUsers.current.includes(leftUserId)) {
            const index = existingUsers.current.indexOf(leftUserId);
            existingUsers.current.splice(index, 1);
          }
          // Close WebRTC connection
          peerConnections.current[leftUserId].pc.close();

          // Update leaving message
          const newComment = {
            username: peerConnections.current[leftUserId].username,
            time: Date(),
            text: `${peerConnections.current[leftUserId].username} has left the room.`,
            isSystem: true,
          };
          const newCommentList = [...commentList, newComment];
          setCommentList(newCommentList);

          // delete user info
          delete peerConnections.current[leftUserId];

          // Force rerender on the UI
          setValue((value) => value + 1);
        }
      });
    });

    //return () => {}

    // Below are the wrapped functions ONLY used in this useEffect

    // Initialize Peer Connection
    async function initPeerConnection(userId) {
      console.log(`COUNT: initPeerConnection() is called on ${userId}`);
      // If peer Connection has been created before, return
      if (peerConnections.current.hasOwnProperty(userId)) return;

      // Initialize and store new Peer Connection
      createNewPeerConnection(userId);

      // Create offer descript and set to local
      const description = await peerConnections.current[
        userId
      ].pc.createOffer();
      const RTCoffer = {
        sdp: description.sdp,
        type: description.type,
      };
      await peerConnections.current[userId].pc.setLocalDescription(description);
      console.log("Peer Connection after setLocalDescription");
      console.log(peerConnections.current);
      console.log(peerConnections.current[userId].pc);

      await sleep(2000);
      await updateConnectionData(userId, { RTCoffer: RTCoffer });
      //const localDesc = peerConnections.current[userId].pc.localDescription;

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
      console.log("update connection data:");
      console.log(payload);
    }

    async function connectNewUser(newUserId, remoteRTCoffer) {
      createNewPeerConnection(newUserId);
      const desc = new RTCSessionDescription(remoteRTCoffer);
      await peerConnections.current[newUserId].pc.setRemoteDescription(desc);
      const localRTCoffer = await peerConnections.current[
        newUserId
      ].pc.createAnswer();
      await peerConnections.current[newUserId].pc.setLocalDescription(
        localRTCoffer
      );
      const offer = {
        type: localRTCoffer.type,
        sdp: localRTCoffer.sdp,
      };
      await updateConnectionData(newUserId, { RTCoffer: offer });
      //console.log(`[system] ${newUserId} joined the room.`);
      console.log(peerConnections.current);
    }

    function createNewPeerConnection(userId) {
      if (peerConnections.current.hasOwnProperty(userId)) return;
      peerConnections.current[userId] = {};
      peerConnections.current[userId].pc = new RTCPeerConnection(servers);
      // Push tracks from local stream to peer connection
      localStream.current.getTracks().forEach((track) => {
        console.log(`Pushing track ... ${new Date().getTime()}`);
        console.log(track);
        peerConnections.current[userId].pc.addTrack(track, localStream.current);
      });

      peerConnections.current[userId].audioStream = new MediaStream();
      peerConnections.current[userId].pc.ontrack = (event) => {
        console.log(`Getting track ... ${new Date().getTime()}`);
        event.streams[0].getTracks().forEach((track) => {
          peerConnections.current[userId].audioStream.addTrack(track);
        });
      };

      // Listen for any IceCandidate update and write to Firestore
      peerConnections.current[userId].pc.onicecandidate = (event) => {
        event.candidate &&
          updateConnectionData(userId, {
            ICEcandidate: event.candidate.toJSON(),
          });
      };
      peerConnections.current[userId].mute = false;

      // Event listener for creating receive channel
      peerConnections.current[userId].pc.ondatachannel = (event) => {
        receiveChannelCallback(event, userId);
      };
      // Create send channel for chat text transmission
      createChannel(userId);
    }

    async function handleICEqueue(userId) {
      while (pendingICEcandidates.current[userId].length > 0) {
        const candidate = pendingICEcandidates.current[userId].pop();
        await addICEcandidate(userId, candidate);
      }
    }

    function hasStableConnection(userId) {
      console.log("Connection Status:");
      console.log(
        `has pc         : ${peerConnections.current.hasOwnProperty(userId)}`
      );
      if (peerConnections.current.hasOwnProperty(userId)) {
        console.log(
          `connectionState: ${peerConnections.current[userId].pc.connectionState}`
        );
        console.log(
          `signalingState : ${peerConnections.current[userId].pc.signalingState}`
        );
      }

      if (!peerConnections.current.hasOwnProperty(userId)) return false;
      if (peerConnections.current[userId].pc.signalingState !== "stable")
        return false;
      return true;
    }

    // Channel is for chat text transmission
    function createChannel(userId) {
      console.log("create data Channel");
      if (peerConnections.current[userId].hasOwnProperty("sendChannel")) return;
      peerConnections.current[userId].sendChannel =
        peerConnections.current[userId].pc.createDataChannel("chat");
    }

    function receiveChannelCallback(event, userId) {
      peerConnections.current[userId].receiveChannel = event.channel;
      peerConnections.current[userId].receiveChannel.onmessage =
        handleReceiveMessage;
    }
  }, [roomId, userId, initialized, username]);

  // Page UI
  if (!initialized)
    return (
      <>
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
      </>
    );
  return (
    <HomePage>
      <div className="flex-1 p-10 text-2xl font-bold">
        Room id: {roomId}
      </div>
      {Object.keys(peerConnections.current).map(userId => (
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
        <Button text="Connect Audio"/>
      </div>
      <div onClick={disconnectAudio}>
        <Button text="Disconnect Audio"/>
      </div>
      <div onClick={leave}>
        <Button text="Leave"/>
      </div>
      <div onClick={() => {sendMsgAll({
        user: username,
        message: 'Hello all.'
      })}}>
        <Button text="SendMsg"/>
      </div>
      
    </HomePage>
  );

  function connectAudio() {
    console.log("connecting Audio")
    Object.keys(peerConnections.current).map(userId => {
      const remoteAudio = document.getElementById(userId);
      console.log(`remoteAudio of ${userId}`)
      console.log(remoteAudio)
      console.log()
      remoteAudio.srcObject = peerConnections.current[userId].audioStream;
    })
    const callbackAudio = document.getElementById("callbackAudio");
    callbackAudio.srcObject = callbackStream.current;
  }

  function disconnectAudio() {
    console.log("Disconnecting Audio");
    Object.keys(peerConnections.current).map((userId) => {
      const remoteAudio = document.getElementById(userId);
      remoteAudio.srcObject = null;
    });
  }

  async function leave() {
    await unsubscribe();
    const db = getFirestore();
    await deleteDoc(doc(db, `rooms/${roomId}/RTCinfo/${userId}`));
    // remove user in Firestore
    /*
    const calleesDoc = collection(db, `rooms/${roomId}/RTCinfo/${userId}/callees`);
    const calleesDocSnapshot = await getDocs(calleesDoc);
    calleesDocSnapshot.forEach(async (docSnapshot) => {
      if (docSnapshot === undefined) return;
      await deleteDoc(docSnapshot.doc);
    });
    */
    // stop audio transfer
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    // close all peer connections
    Object.keys(peerConnections.current).map((userId) => {
      peerConnections.current[userId].pc.close();
      peerConnections.current[userId].sendChannel.close();
      peerConnections.current[userId].receiveChannel.close();
    });

    // Clear data
    peerConnections.current = {};
    existingUsers.current = [];
    localStream.current = null;
    pendingICEcandidates.current = {};
    setInitialized(false);

    location.href = "/";
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
    const candidate = new RTCIceCandidate(ICEcandidate);
    await peerConnections.current[newUserId].pc.addIceCandidate(candidate);
  }

  function sendMsgAll(obj) {
    Object.keys(peerConnections.current).map((userId) => {
      console.log(peerConnections.current[userId].sendChannel.readyState);
      if (peerConnections.current[userId].sendChannel.readyState === "open") {
        peerConnections.current[userId].sendChannel.send(JSON.stringify(obj));
      }
    });
  }

  function handleReceiveMessage(event) {
    const data = JSON.parse(event.data);
    const username = data.username;
    const message = data.message;
    const type = data.type;
    // console.log(`${user}: ${message}`);
    // If message is chat, update in comment list
    if (type === "chat") {
      const newComment = {
        username: username,
        time: Date(),
        text: message,
        isSystem: false,
      };
      const newCommentList = [...commentList, newComment];
      setCommentList(newCommentList);
    } else if (type === "system") {
      const newComment = {
        username: localStorage.getItem("username"),
        time: Date(),
        text: commentText,
        isSystem: true,
      };
      const newCommentList = [...commentList, newComment];
      setCommentList(newCommentList);
    } else if (type === "setUser") {
      const avatar = data.avatar;
      peerConnections.current[userId].username = username;
      peerConnections.current[userId].avatar = avatar;
      // Force rerender on the UI
      setValue((value) => value + 1);
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