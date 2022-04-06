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
import { Box, Dialog, DialogTitle, DialogContent } from "@mui/material";
import { firebaseConfig } from "../../firebase/config";
import sleep from "../../utils/sleep";
import RoomMangementPanel from "./roomManagement";
import UserUtilityPanel from "./userUtility";
import SongManagementPanel from "./songManagement";
import { processFile, stripFileExtension } from "../../utils/fileUtils";
import Button from "../../component/elements/button";

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
  let commentList = useRef([]);
  let allSongList = useRef([]);
  let allAudioList = useRef([]);

  // Check if user enters from Lobby
  const [fromLobby, setFromLobby] = useState(true);

  // Only reload when users enter/leave
  const [value, setValue] = useState(false);

  // Initialization indicates
  const [initialized, setInitialized] = useState(false);

  // User info
  const [username, setUsername] = useState();
  const [avatar, setAvatar] = useState();
  const [userId, setUserId] = useState();
  const [roomCreatorId, setRoomCreatorId] = useState();

  const [currentRoomType, setCurrentRoomType] = useState("private");
  const [isMuted, setIsMuted] = useState(false);
  const [echo, setEcho] = useState(50);
  const [volume, setVolume] = useState(50);

  const [currentSong, setCurrentSong] = useState(null);
  const [currentSongIsPlaying, setCurrentSongIsPlaying] = useState(false);

  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);

  const handleMuteUnmute = () => {
    setIsMuted(!isMuted);
    sendMsgAll({
      userId: userId,
      username: username,
      type: "setMute",
    });
  };

  const updateUI = () => {
    setValue((value) => !value);
  };

  useEffect(() => {
    if (currentSongIsPlaying) currentSong?.play();
    else currentSong?.pause();
  }, [currentSongIsPlaying]);

  useEffect(() => {
    if (currentSong !== null) {
      currentSong.volume = volume / 100;
    }
  }, [volume, currentSong]);

  const handleStartSong = () => {
    if (currentSong === allAudioList.current[0]) {
      // The user has paused, and now we need to resume
      console.log("Resume song!");
    } else {
      setCurrentSong(allAudioList.current[0]);
      console.log("Start song!");
    }
    setCurrentSongIsPlaying(true);
  };

  const handleStopSong = () => {
    setCurrentSongIsPlaying(false);
    console.log("Stopped song!");
  };

  const handleFinishedSong = () => {
    allSongList.current = allSongList.current.slice(1);
    allAudioList.current = allAudioList.current.slice(1);
    setCurrentSongIsPlaying(false);
    setCurrentSong(null);
    console.log("Finished song!");
  };

  const handleAddSong = async (event) => {
    if (!event.target.files.length) return; //if clicked cancel button
    const [file] = event.target.files;
    event.target.value = null;
    const data = await processFile(file);
    const audio = new Audio(data.content);
    audio.onended = handleFinishedSong;
    const cleantFileName = stripFileExtension(file.name);
    const newAllSongList = [...allSongList.current, cleantFileName];
    const newAudioList = [...allAudioList.current, audio];
    allSongList.current = newAllSongList;
    allAudioList.current = newAudioList;
    updateUI();
  };

  const handleDeleteSong = () => {
    if (allSongList.current.length === 1) {
      //if deleting the playing song
      setCurrentSongIsPlaying(false);
    }
    //delete the last element in allSongList if it is not empty
    allSongList.current = allSongList.current.slice(0, -1);
    allAudioList.current = allAudioList.current.slice(0, -1);
    updateUI();
  };

  const handleEcho = (event) => {
    setEcho(event.target.value);
  };

  const handleVolume = (event) => {
    setVolume(event.target.value);
  };

  const handleAddComment = (commentText) => {
    commentList.current.push({
      username: username,
      time: Date(),
      text: commentText,
      isSystem: false,
    });

    // Force rerender on the UI
    updateUI();

    // Send the chat message to other users
    sendMsgAll({
      userId: userId,
      username: username,
      type: "chat",
      message: commentText,
    });
  };

  function handleMoveSong(prevIndex, currentIndex) {
    //swap the two elements inside a list based on prevIndex and currentIndex
    if (prevIndex === 0 || currentIndex === 0) {
      if (allSongList.current.length !== 1) {
        setCurrentSongIsPlaying(false);
        if (currentSong !== null) currentSong.currentTime = 0; // redial the current time of the song
      }
    }
    if (currentIndex === allSongList.current.length) return;
    else if (currentIndex === -1) return;

    let newAllSongList = [...allSongList.current];
    newAllSongList[prevIndex] = allSongList.current[currentIndex];
    newAllSongList[currentIndex] = allSongList.current[prevIndex];
    allSongList.current = newAllSongList;

    let newAudioList = [...allAudioList.current];
    newAudioList[prevIndex] = allAudioList.current[currentIndex];
    newAudioList[currentIndex] = allAudioList.current[prevIndex];
    allAudioList.current = newAudioList;

    updateUI();
  }

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

  // Retrieve the userId of the room creator
  useEffect(() => {
    if (!roomId) return;
    checkRoomCreator();
    async function checkRoomCreator() {
      const db = getFirestore();
      const roomDoc = doc(db, `rooms/${roomId}`);
      console.log("roomId: ");
      console.log(roomId);
      const roomSnapshot = await getDoc(roomDoc);
      const data = roomSnapshot.data();
      const creatorId = data.creatorId;
      setRoomCreatorId(creatorId);
    }
  }, [roomId]);

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

    // Check if user is from lobby
    const storedRoomId = localStorage.getItem("roomId");
    if (!roomId) return;
    if (storedRoomId !== roomId) {
      setFromLobby(false);
      return;
    }

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
            // return if the connection is already formed
            if (hasStableConnection(newUserId)) return;

            if (
              peerConnections.current[newUserId].pc.remoteDescription === null
            ) {
              console.log(`Current remote desc:`);
              console.log(
                peerConnections.current[newUserId].pc.remoteDescription
              );
              // Case: Joined room as a new comer
              // If created the connection first and got answer back:
              // 1. if pc.currentRemote is null => setRemote
              if (existingUsers.current.includes(newUserId)) {
                const desc = new RTCSessionDescription(fromRTCoffer);

                await peerConnections.current[
                  newUserId
                ].pc.setRemoteDescription(desc);

                //console.log(`[system] ${newUserId} joined the room.`);
                console.log(peerConnections.current);

                await sleep(1000);
                // Send user info to other users
                sendMsg(newUserId, {
                  type: "setUser",
                  username: username,
                  userId: userId,
                  avatar: avatar,
                });
                //TODO: Delete your userId in Firebase queue
                const roomIdDoc = doc(db, `rooms/${roomId}`);
                const roomIdSnapshot = await getDoc(roomIdDoc);
                const roomIdData = roomIdSnapshot.data();
                const queue = roomIdData.queue;
                const newQueue = queue.filter((id) => id !== userId);
                await updateDoc(roomIdDoc, { queue: newQueue });
              }
              // Case: A new comer has joined the room
              // If other created the connection first:
              // 1. setRemote
              // 2. createOffer
              // 3. setLocal
              if (!existingUsers.current.includes(newUserId)) {
                await connectNewUser(newUserId, fromRTCoffer);

                await sleep(1000);
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
          console.log(`Left: ${leftUserId}`);
          console.log(peerConnections.current);
          commentList.current.push({
            username: peerConnections.current[leftUserId].username,
            time: Date(),
            text: `${peerConnections.current[leftUserId].username} has left the room.`,
            isSystem: true,
          });

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
      peerConnections.current[userId].isMuted = false;

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
      if (!peerConnections.current.hasOwnProperty(userId)) return false;
      if (
        peerConnections.current[userId].pc.connectionState !== "connected" ||
        peerConnections.current[userId].pc.signalingState === "stable"
      )
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

    function handleReceiveMessage(event) {
      const data = JSON.parse(event.data);
      const username = data.username;
      const message = data.message;
      const userId = data.userId;
      const type = data.type;

      // console.log(`${user}: ${message}`);
      // If message is chat, update in comment list
      if (type === "chat") {
        commentList.current.push({
          username: username,
          time: Date(),
          text: message,
          isSystem: false,
        });
      } else if (type === "system") {
        commentList.current.push({
          username: username,
          time: Date(),
          text: message,
          isSystem: true,
        });
      } else if (type === "setUser") {
        const avatar = data.avatar;
        peerConnections.current[userId].username = username;
        peerConnections.current[userId].avatar = avatar;

        commentList.current.push({
          username: username,
          time: Date(),
          text: `${username} has joined the room.`,
          isSystem: true,
        });
      } else if (type === "setMute") {
        peerConnections.current[userId].isMuted =
          !peerConnections.current[userId].isMuted;
      }
      // Force rerender on the UI
      updateUI();
    }
  }, [roomId, userId, initialized, username, avatar, commentList]);

  // Page UI
  return (
    <>
      <Dialog open={!fromLobby}>
        <DialogTitle>Please join the room from Lobby.</DialogTitle>
        <DialogContent>
          <div
            onClick={() => {
              leave(true);
            }}
          >
            <Button text="Close"></Button>
          </div>
        </DialogContent>
      </Dialog>
      <Box
        className="hide-scrollbar"
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100vh",
          background: "#434343",
        }}
      >
        <Box sx={{ width: "23%" }}>
          <RoomMangementPanel
            otherUsersList={getUsersList()}
            peerConnections={peerConnections}
            leave={leave}
            roomId={roomId}
            roomCreatorId={roomCreatorId}
            currentRoomType={currentRoomType}
            isMuted={isMuted}
            handleMuteUnmute={handleMuteUnmute}
          />
        </Box>
        <Box sx={{ width: "54%" }} style={{ background: "#1C1C1C" }}>
          <UserUtilityPanel
            isMuted={isMuted}
            echo={echo}
            volume={volume}
            handleEcho={handleEcho}
            handleVolume={handleVolume}
            commentList={commentList.current}
            handleAddComment={handleAddComment}
          />
        </Box>
        <Box sx={{ width: "23%" }} style={{ backgroundColor: "#1C1C1C" }}>
          <SongManagementPanel
            allSongList={allSongList.current}
            currentRoomType={currentRoomType}
            isRoomCreator={roomCreatorId == userId}
            handleStartSong={handleStartSong}
            handleStopSong={handleStopSong}
            handleAddSong={handleAddSong}
            handleDeleteSong={handleDeleteSong}
            handleMoveSong={handleMoveSong}
          />
        </Box>
      </Box>
      {/* </div> */}
    </>
  );

  async function leave(redirect = false) {
    // Remove roomId from localStorage
    localStorage.removeItem("roomId");

    // Remove any listeners to Firestore
    unscribeFirestore();

    const db = getFirestore();

    // Remove the user record in the room
    await deleteDoc(doc(db, `rooms/${roomId}/RTCinfo/${userId}`));

    // If the left user is the creator of the room,
    // Delete the room when the creator left
    if (roomCreatorId == userId) {
      await deleteDoc(doc(db, `rooms/${roomId}`));
    }

    // Stop audio transfer
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

    if (redirect) {
      router.push("/");
    } else {
      window.close();
    }
  }

  async function addICEcandidate(newUserId, ICEcandidate) {
    const candidate = new RTCIceCandidate(ICEcandidate);
    await peerConnections.current[newUserId].pc.addIceCandidate(candidate);
  }

  // Firestore unscribe onsnapshot
  function unscribeFirestore() {
    const db = getFirestore();
    onSnapshot(collection(db, `rooms/${roomId}/RTCinfo`), () => {});
    onSnapshot(
      collection(db, `rooms/${roomId}/RTCinfo/${userId}/callees`),
      () => {}
    );
  }

  // Transfer peer connection to otherUsersList

  function getUsersList() {
    let otherUsersList = {};
    otherUsersList[userId] = {
      isMuted: isMuted,
      username: username,
      avatar: avatar,
    };
    Object.keys(peerConnections.current).map((id) => {
      if (id === userId) return;
      otherUsersList[id] = {
        isMuted: peerConnections.current[id].isMuted,
        username: peerConnections.current[id].username,
        avatar: peerConnections.current[id].avatar,
      };
    });
    return otherUsersList;
  }

  function sendMsgAll(obj) {
    console.log("message:", obj);
    const connectAllUsers = async () => {
      await Promise.all(
        Object.keys(peerConnections.current).map(async (userId) => {
          await sendMsg(userId, obj);
        })
      );
    };
    connectAllUsers();
  }

  async function sendMsg(userId, obj) {
    if (peerConnections.current[userId].sendChannel.readyState === "open") {
      peerConnections.current[userId].sendChannel.send(JSON.stringify(obj));
    } else {
      await sleep(1000);
      await sendMsg(userId, obj);
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