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
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  IconButton,
  DialogActions,
} from "@mui/material";
import { firebaseConfig } from "../../firebase/config";
import sleep from "../../utils/sleep";
import RoomMangementPanel from "./roomManagement";
import UserUtilityPanel from "./userUtility";
import SongManagementPanel from "./songManagement";
import { processFile, stripFileExtension } from "../../utils/fileUtils";
import Button from "../../component/elements/button";
import { WindowSharp } from "@mui/icons-material";
import removeUserQueue from "../../utils/room/userOffQueue";
import CloseIcon from "@mui/icons-material/Close";

export default function Room() {
  // Routing parameter
  const router = useRouter();
  const roomId = router.query.id;
  const FILE_LIMIT = 10000000;

  let _userId = null;
  let _roomCreatorId = null;
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
  let unsubscribeCallee = useRef();
  let unsubscribeLeftUser = useRef();
  let receiveSongBuffer = useRef({});
  let lastSend = useRef(null);
  let emojiRef = useRef();
  let downloadSongStatus = useRef({});

  // Check if user enters from Lobby
  const [fromLobby, setFromLobby] = useState(true);

  // Only reload when users enter/leave
  const [value, setValue] = useState(false);

  // Initialization indicates
  const [initialized, setInitialized] = useState(false);
  const [initConn, setInitConn] = useState(false);

  // User info
  const [username, setUsername] = useState();
  const [avatar, setAvatar] = useState();
  const [userId, setUserId] = useState();
  const [roomCreatorId, setRoomCreatorId] = useState();

  const [currentRoomType, setCurrentRoomType] = useState();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(25);

  const [currentSong, setCurrentSong] = useState(null);
  const [currentSongIsPlaying, setCurrentSongIsPlaying] = useState(false);
  const [dataChannelFullOpen, setDataChannelFullOpen] = useState(false);
  const [fileTooLargeOpen, setFileTooLargeOpen] = useState(false);

  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);

  const handleMuteUnmute = () => {
    const newMuted = !isMuted;
    localStream.current.getAudioTracks()[0].enabled = newMuted === false;
    setIsMuted(newMuted);
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
    if (!allAudioList.current) return;
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
    if (data.content.length > FILE_LIMIT) {
      setFileTooLargeOpen(true);
    } else {
      const cleantFileName = stripFileExtension(file.name);
      const currentTime = Date.now();
      if (
        lastSend.current === null ||
        currentTime - lastSend.current >= 20000
      ) {
        // Notify other users that a song is going to be uploaded
        sendMsgAll({
          userId: userId,
          type: "songAction",
          action: "upload",
        });
        sendMsgAll({
          username: username,
          type: "system",
          message: `${username} is uploading song -- ${cleantFileName}.`,
        });
        lastSend.current = currentTime;
        sendSongAll({ songName: cleantFileName, songBuffer: data.content });
        appendSongInfo(cleantFileName, data.content);
      } else if (currentTime - lastSend.current < 20000) {
        setDataChannelFullOpen(true);
      }
    }
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
  const handleFileTooLargeClose = () => setFileTooLargeOpen(false);

  const handleDataFullClose = () => setDataChannelFullOpen(false);

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

  function handleMoveSong(prevIndex, currentIndex, fromOther = false) {
    if (!fromOther) {
      sendMsgAll({
        type: "songAction",
        action: "move",
        prevIndex: prevIndex,
        currentIndex: currentIndex,
      });
    }
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
        localStorage.setItem("_userId", user.id);
      } else {
        // Unauthorized user or jwt expired
        // Prompt to login page
        router.push("/login");
      }
    }
  }, [router]);

  const closeHandler = async () => {
    await leave();
    return "";
  };

  // Add listener when user is about to close the page or refresh
  useEffect(() => {
    window.addEventListener("popstate", () => {
      console.log("called popstate!");
      closeHandler();
    });
    window.addEventListener("beforeunload", closeHandler);
    return () => {
      console.log("_userId: ", _userId);
      console.log("_roomCreatorId: ", _roomCreatorId);
      window.removeEventListener("popstate", () => {
        console.log("called popstate!");
        closeHandler();
      });
      window.removeEventListener("beforeunload", closeHandler);
    };
  }, []);

  // Retrieve the userId of the room creator
  // Retrieve current room type
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
      console.log(data);
      const creatorId = data?.creatorId;
      console.log(`creatorId == userId: ${creatorId == userId}`);
      setRoomCreatorId(creatorId);
      localStorage.setItem("_creatorId", creatorId);
    }
    setCurrentRoomType(localStorage.getItem("_roomType"));
  }, [roomId]);

  // Initialize audio stream and WebRTC
  // Get peer WebRTC info and connect
  // Only run once after roomId is get
  useEffect(() => {
    console.log(`initConn: ${initConn}`);
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
    console.log(`initialized = ${initialized}`);
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

      if (
        localStorage.getItem("_roomType") === "streaming" &&
        localStorage.getItem("_userId") !== localStorage.getItem("_creatorId")
      ) {
        console.log("mute myself!");
        handleMuteUnmute();
      }

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

    // Listen to any changes only after own first connection is initialized

    // Listen for any joined user
    unsubscribeCallee.current = onSnapshot(calleeDoc, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        // Get new user info
        const newUserDoc = change.doc;
        const newUserId = newUserDoc.id;
        if (newUserId === userId) return;
        // If a new user joined, connect with WebRTC
        if (change.type === "added" || change.type === "modified") {
          console.log("new user joined!");
          // Create new connection
          createNewPeerConnection(newUserId);

          console.log("Finished create new peer connection");
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
              if (existingUsers.current.includes(newUserId) && !initConn) {
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
                await removeUserQueue(db, userId, roomId);
                setInitConn(true);
              }
              // Case: A new comer has joined the room
              // If other created the connection first:
              // 1. setRemote
              // 2. createOffer
              // 3. setLocal
              if (!existingUsers.current.includes(newUserId)) {
                try {
                  await connectNewUser(newUserId, fromRTCoffer);
                } catch (error) {
                  console.log("Error in connecting new user!");
                }

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
    unsubscribeLeftUser.current = onSnapshot(allUserDoc, (snapshot) => {
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

          // Update leaving message
          console.log(`Left: ${leftUserId}`);
          console.log(peerConnections.current);
          commentList.current.push({
            username: peerConnections.current[leftUserId].username,
            time: Date(),
            text: `${peerConnections.current[leftUserId].username} has left the room.`,
            isSystem: true,
          });

          // clear connection of the left user
          removePeerConnection(leftUserId);

          // Force rerender on the UI
          updateUI();
        }
      });
    });

    //return () => {}

    // Below are the wrapped functions ONLY used in this useEffect

    // Initialize Peer Connection
    async function initPeerConnection(userId) {
      console.log(`COUNT: initPeerConnection() is called on ${userId}`);
      // If peer Connection has been created before, return
      try {
        if (peerConnections.current.hasOwnProperty(userId)) {
          console.log(
            "already formed connection, deleting previous connection."
          );
          removePeerConnection(userId);
          console.log("Deleted previous connection.");
        }

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
        await peerConnections.current[userId].pc.setLocalDescription(
          description
        );
        console.log("Peer Connection after setLocalDescription");
        console.log(peerConnections.current);
        console.log(peerConnections.current[userId].pc);

        await sleep(2000);
        await updateConnectionData(userId, { RTCoffer: RTCoffer });
        //const localDesc = peerConnections.current[userId].pc.localDescription;

        // Create firestore document for new user to connect to you
        await createNewUserFirestore();
      } catch (error) {
        console.error(error);
      }
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
      console.log("connect new user!");
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
        console.log(`Pushing track to ${userId} ... ${new Date().getTime()}`);
        console.log(track);
        // if (isMuted) {
        //   console.log("I am muted!");
        //   localStream.current.getAudioTracks()[0].enabled = false;
        // }
        peerConnections.current[userId].pc.addTrack(track, localStream.current);
      });

      peerConnections.current[userId].audioStream = new MediaStream();
      peerConnections.current[userId].pc.ontrack = (event) => {
        console.log(`Getting track from ${userId}... ${new Date().getTime()}`);
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
      console.log(`userId: ${userId}`);
      console.log(`roomCreatorId: ${localStorage.getItem("_creatorId")}`);
      if (
        localStorage.getItem("_roomType") === "streaming" &&
        userId !== localStorage.getItem("_creatorId")
      )
        peerConnections.current[userId].isMuted = true;
      else {
        peerConnections.current[userId].isMuted = false;
      }

      console.log(
        `userId ${userId} is muted ${peerConnections.current[userId].isMuted}`
      );

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
      console.log("Have good and stable connection!");
      return true;
    }

    // Channel is for chat text transmission
    function createChannel(userId) {
      console.log("create data Channel");
      if (
        peerConnections.current[userId].hasOwnProperty("messageChannel") &&
        peerConnections.current[userId].hasOwnProperty("songChannel")
      )
        return;
      if (!peerConnections.current[userId].hasOwnProperty("messageChannel"))
        peerConnections.current[userId].messageChannel =
          peerConnections.current[userId].pc.createDataChannel("message");
      if (!peerConnections.current[userId].hasOwnProperty("songChannel"))
        peerConnections.current[userId].songChannel =
          peerConnections.current[userId].pc.createDataChannel("song");
    }

    function receiveChannelCallback(event, userId) {
      if (event.channel.label === "message") {
        console.log(event.channel);
        peerConnections.current[userId].receiveMessageChannel = event.channel;
        peerConnections.current[userId].receiveMessageChannel.onmessage =
          handleReceiveMessage;
      }
      if (event.channel.label === "song") {
        peerConnections.current[userId].receiveSongChannel = event.channel;
        peerConnections.current[userId].receiveSongChannel.onmessage =
          handleReceiveSong;
      }
    }

    function removePeerConnection(leftUserId) {
      console.log(`Removing connection of ${leftUserId}`);
      if (!peerConnections.current.hasOwnProperty(leftUserId)) return;
      if (!peerConnections.current[leftUserId].hasOwnProperty("pc")) return;
      peerConnections.current[leftUserId].pc.close();
      peerConnections.current[leftUserId].pc.onicecandidate = null;
      peerConnections.current[leftUserId].pc.ondatachannel = null;
      if (
        peerConnections.current[leftUserId].hasOwnProperty(
          "receiveMessageChannel"
        )
      ) {
        peerConnections.current[leftUserId].receiveMessageChannel.close();
      }
      if (
        peerConnections.current[leftUserId].hasOwnProperty("receiveSongChannel")
      ) {
        peerConnections.current[leftUserId].receiveSongChannel.close();
      }
      if (
        peerConnections.current[leftUserId].hasOwnProperty("messageChannel")
      ) {
        peerConnections.current[leftUserId].messageChannel.close();
      }
      if (peerConnections.current[leftUserId].hasOwnProperty("songChannel")) {
        peerConnections.current[leftUserId].songChannel.close();
      }
      delete peerConnections.current[leftUserId];
      delete pendingICEcandidates.current[leftUserId];
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
      } else if (type === "songAction") {
        const action = data.action;
        if (action === "start") {
          handleStartSong();
        } else if (action === "stop") {
          handleStopSong();
        } else if (action === "delete") {
          handleDeleteSong();
        } else if (action === "move") {
          handleMoveSong(data.prevIndex, data.currentIndex);
        } else if (action == "upload") {
          Object.keys(peerConnections.current).map((userId) => {
            downloadSongStatus.current[userId] = false;
          });
        } else if (action == "receive") {
          downloadSongStatus.current[data.userId] = true;
        } else if (action == "finish") {
          for (const userId in downloadSongStatus.current) {
            delete downloadSongStatus.current[userId];
          }
        }
      }
      // Force rerender on the UI
      updateUI();
    }

    function handleReceiveSong(event) {
      const data = JSON.parse(event.data);
      const sender = data.sender;
      if (!receiveSongBuffer.current.hasOwnProperty(sender)) {
        receiveSongBuffer.current[sender] = {
          songName: data.songName,
          sender: sender,
          songBufferLength: data.songBufferLength,
          totalChunkNo: data.totalChunkNo,
          songBufferChunk: new Array(data.totalChunkNo).fill(null),
        };
      }
      receiveSongBuffer.current[sender].songBufferChunk[data.chunkNo - 1] =
        data.songBufferChunk;
      if (
        !receiveSongBuffer.current[sender].songBufferChunk.some(
          (chunk) => chunk === null
        )
      ) {
        // Entire song is received
        const songBuffer =
          receiveSongBuffer.current[sender].songBufferChunk.join("");
        console.log("current length: ", songBuffer.length);
        console.log(
          "theoretical length: ",
          receiveSongBuffer.current[sender].songBufferLength
        );
        const songName = receiveSongBuffer.current[sender].songName;
        appendSongInfo(songName, songBuffer);
        delete receiveSongBuffer.current[sender];

        // Notify other that song is received here
        sendMsgAll({
          username: username,
          type: "system",
          message: `${username} has received song ${songName}.`,
        });
        sendMsgAll({
          type: "songAction",
          action: "receive",
          userId: userId,
        });
        // Check if is the last one to receive the song
        let isLast = true;
        for (const userId in downloadSongStatus.current) {
          if ((downloadSongStatus.current[userId] = false)) {
            isLast = false;
            break;
          }
        }
        if (isLast) {
          sendMsgAll({
            type: "songAction",
            action: "finish",
          });
          sendMsgAll({
            type: "songAction",
            action: "start",
          });
          for (const userId in downloadSongStatus.current) {
            delete downloadSongStatus.current[userId];
          }
          handleStartSong();
        }
      } else {
        console.log(`Passing data!`);
      }
    }
  }, [roomId, userId, initialized, username, avatar, commentList, initConn]);

  // Page UI
  return (
    <>
      {fileTooLargeOpen && (
        <FileTooLargeDialog
          open={fileTooLargeOpen}
          close={handleFileTooLargeClose}
        />
      )}
      {dataChannelFullOpen && (
        <DataChannelFullDialog
          open={dataChannelFullOpen}
          close={handleDataFullClose}
        />
      )}
      <Dialog open={!fromLobby}>
        <DialogTitle>Please join the room from Lobby.</DialogTitle>
        <DialogContent>
          <Button text="Close" onClick={closeHandler} />
        </DialogContent>
      </Dialog>
      <Box
        className="hide-scrollbar"
        sx={{
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
            isRoomCreator={roomCreatorId == userId}
            closeHandler={closeHandler}
            roomId={roomId}
            roomCreatorId={roomCreatorId}
            currentRoomType={currentRoomType}
            isMuted={isMuted}
            handleMuteUnmute={handleMuteUnmute}
          />
        </Box>
        <Box sx={{ width: "54%", background: "#1C1C1C" }}>
          <UserUtilityPanel
            isMuted={isMuted}
            volume={volume}
            emojiRef={emojiRef}
            handleEcho={handleEcho}
            handleVolume={handleVolume}
            commentList={commentList.current}
            handleAddComment={handleAddComment}
          />
        </Box>
        <Box sx={{ width: "23%", backgroundColor: "#1C1C1C" }}>
          <SongManagementPanel
            allSongList={allSongList.current}
            currentRoomType={currentRoomType}
            isRoomCreator={roomCreatorId == userId}
            handleStartSong={handleStartSong}
            handleStopSong={handleStopSong}
            handleAddSong={handleAddSong}
            handleDeleteSong={handleDeleteSong}
            handleMoveSong={handleMoveSong}
            sendMsgAll={sendMsgAll}
            username={username}
          />
        </Box>
      </Box>
      {/* </div> */}
    </>
  );

  async function leave(redirect = false) {
    // Remove roomId from localStorage
    if (!localStorage.getItem("roomId")) return;
    localStorage.removeItem("roomId");
    let _userId = localStorage.getItem("_userId");
    let _roomCreatorId = localStorage.getItem("_creatorId");

    try {
      // Remove any listeners to Firestore
      unsubscribeCallee.current();
      unsubscribeLeftUser.current();
    } catch (error) {
      console.log(error);
    }

    const db = getFirestore();

    // Remove the user record in the room
    await deleteDoc(doc(db, `rooms/${roomId}/RTCinfo/${_userId}`));

    // If the left user is the creator of the room,ha
    // Delete the room when the creator left
    if (_roomCreatorId === _userId) {
      console.log(`roomCreatorId == undefined: ${_roomCreatorId == undefined}`);
      console.log("delete the whole doc!");
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
      peerConnections.current[userId].messageChannel.close();
      peerConnections.current[userId].receiveMessageChannel.close();
      peerConnections.current[userId].songChannel.close();
      peerConnections.current[userId].receiveSongChannel.close();
      delete peerConnections.current[userId];
    });

    // Clear data
    peerConnections.current = {};
    existingUsers.current = [];
    localStream.current = null;
    pendingICEcandidates.current = {};

    router.push("/");
    location.href = "/";
  }

  async function addICEcandidate(newUserId, ICEcandidate) {
    const candidate = new RTCIceCandidate(ICEcandidate);
    await peerConnections.current[newUserId].pc.addIceCandidate(candidate);
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
    console.log("pc data: ", peerConnections.current[userId]);
    if (peerConnections.current[userId].messageChannel.readyState === "open") {
      peerConnections.current[userId].messageChannel.send(JSON.stringify(obj));
    } else {
      await sleep(1000);
      await sendMsg(userId, obj);
    }
  }

  async function sendSongAll(obj) {
    console.log("song:", obj);
    const connectAllUsers = async () => {
      await Promise.all(
        Object.keys(peerConnections.current).map(async (userId) => {
          await sendSong(userId, obj);
        })
      );
    };
    connectAllUsers();
  }

  async function sendSong(userId, obj) {
    const songChannel = peerConnections.current[userId].songChannel;
    if (songChannel.readyState === "open") {
      const songBuffer = obj.songBuffer;
      const CHUNK_LEN = 64000;
      const songLength = songBuffer.length;
      const chunkSize = songLength / CHUNK_LEN;

      for (const i = 0; i < chunkSize; i++) {
        const start = i * CHUNK_LEN;
        const end = (i + 1) * CHUNK_LEN;
        const songBufferInfo = {
          songName: obj.songName,
          sender: userId,
          chunkNo: i + 1,
          songBufferLength: songLength,
          totalChunkNo: Math.ceil(chunkSize),
          songBufferChunk: songBuffer.slice(start, end),
          type: "songBuffer",
        };
        // try {
        //   songChannel.send(JSON.stringify(songBufferInfo));
        // } catch (error) {
        //   setDataChannelFullOpen(true);
        // }
        songChannel.send(JSON.stringify(songBufferInfo));
      }
    }
  }

  function appendSongInfo(songName, songBuffer) {
    const audio = new Audio(songBuffer);
    audio.onended = handleFinishedSong;
    const newAllSongList = [...allSongList.current, songName];
    const newAudioList = [...allAudioList.current, audio];
    allSongList.current = newAllSongList;
    allAudioList.current = newAudioList;
    updateUI();
  }
}

function FileTooLargeDialog(props) {
  return (
    <Dialog
      open={props.open}
      aria-labelledby="file-too-large-title"
      aria-describedby="file-too-large-description"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <DialogTitle aria-labelledby="file-too-large-title">
          File Too Large
        </DialogTitle>
        <IconButton onClick={props.close}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent>
        <DialogContentText aria-describedby="file-too-large-description">
          Please upload a song within 10MB!
        </DialogContentText>
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

function DataChannelFullDialog(props) {
  return (
    <Dialog
      open={props.open}
      aria-labelledby="data-channel-full-title"
      aria-describedby="data-channel-full-description"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <DialogTitle aria-labelledby="data-channel-full-title">
          Data Channel Full
        </DialogTitle>
        <IconButton onClick={props.close}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent>
        <DialogContentText aria-describedby="data-channel-full-description">
          Adding song too fast! Please wait for a moment before adding a new
          song.
        </DialogContentText>
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

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};
