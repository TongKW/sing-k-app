import React, { useState, useEffect, useRef } from 'react';
import Router, { useRouter } from 'next/router'
import HomePage from '../../component/wrapper/HomePage';
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
  deleteDoc
} from "firebase/firestore";
import { firebaseConfig } from '../../firebase/config';
import Button from '../../component/elements/button';
import sleep from '../../utils/sleep';

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
  let pendingICEcandidates = useRef({});

  // Only reload when users enter/leave
  const [load, reload] = useState(Date.now());  

  // Initialization indicates
  const [initialized, setInitialized] = useState(false);

  // User info
  const [username, setUsername] = useState();
  const [avatar, setAvatar] = useState();
  const [userId, setUserId] = useState();

  // Initialize Firebase 
  const app = firebase.initializeApp(firebaseConfig);

  //--test--
  console.log('Peer connection:');
  console.log(peerConnections)
  //--test--
  
  // Get response of user info and display from local storage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = decrypt_jwt(token).body;
    async function decrypt_jwt(token) {
      const response = await fetch('/api/jwt/decrypt', {
        method: 'POST', 
        body: JSON.stringify({ token: token }),
        headers: {
          'Content-Type': 'application/json'
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
        router.push('/login');
      }
    }
  }, [router]);

  // Initialize audio stream and WebRTC
  // Get peer WebRTC info and connect
  // Only run once after roomId is get
  useEffect(() => {
    const db = getFirestore();
    const allUserDoc = collection(db, `rooms/${roomId}/RTCinfo`);
    const calleeDoc = collection(db, `rooms/${roomId}/RTCinfo/${userId}/callees`);

    if (initialized || !roomId || !userId) return;
    initialize();
    
    // Initialize for first time joining the room
    async function initialize() {
      console.log("COUNT: initalize() is called");
      setInitialized(true);
      // Setup audio
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Get Firebase
      const roomDoc = doc(db, "rooms", roomId);
      const roomSnapshot = await getDoc(roomDoc);
      const roomType = roomSnapshot.data().type;

      const allUserSnapshot = await getDocs(allUserDoc);
      
      allUserSnapshot.forEach(async (docSnapshot) => {
        if (docSnapshot.id !== userId) {
          existingUsers.push(docSnapshot.id);
          const newUserId = docSnapshot.id;
          // Create one WebRTC Peer Connection and update Firestore for every other user
          await initPeerConnection(newUserId);
        }
      });

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
        if (change.type === 'added' || change.type === 'modified') {
          createNewPeerConnection(newUserId);
          if (!(pendingICEcandidates.current.hasOwnProperty(newUserId))) {
            pendingICEcandidates.current[newUserId] = [];
          }
          //await initPeerConnection(newUserId);
          const fromICEcandidate = newUserDoc.data().ICEcandidate
          const fromRTCoffer = newUserDoc.data().RTCoffer

          if (fromRTCoffer) {
            console.log("PROCESS 1.5")
            // If created the connection first and got answer back:
            // 1. if pc.currentRemote is null => setRemote
            if (existingUsers.includes(newUserId)) {
              if (!peerConnections[newUserId].pc.remoteDescription) {
                console.log("PROCESS 2")
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
            if (!(existingUsers.includes(newUserId))) {
              console.log("PROCESS 3")
              await connectNewUser(newUserId, fromRTCoffer);
            }
            // Add all pending ICE candidates
            await handleICEqueue(newUserId);

            /*
            if (!fromICEcandidate || !fromRTCoffer) return;
            // Connect
            await connectNewUser(newUserId, fromICEcandidate, fromRTCoffer);
            */
            
            // Force rerender on the UI
            reload();
          }

          if (fromICEcandidate) {
            console.log('received icecandidate:') 
            console.log(fromICEcandidate)
            if (peerConnections[newUserId].pc.remoteDescription) {
              try {
                await addICEcandidate(newUserId, fromICEcandidate);
              } catch (error) {
                console.log(`Error occurred when adding ICE candidate: ${error}`)
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
        if (change.type === 'removed') {
          const newUserDoc = change.doc;
          const leftUserId = newUserDoc.id;
          if (leftUserId === userId) return;
          await deleteDoc(doc(db, `rooms/${roomId}/RTCinfo/${userId}/callees/${leftUserId}`));
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
      createNewPeerConnection(userId)
  
      
  
      // Create offer descript and set to local
      const description = await peerConnections[userId].pc.createOffer();
      const RTCoffer = {
        sdp: description.sdp,
        type: description.type,
      };
      await peerConnections[userId].pc.setLocalDescription(description);
      console.log('Peer Connection after setLocalDescription');
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
      const userDoc = doc(db, `rooms/${roomId}/RTCinfo/${userId}`)
      await setDoc(userDoc, {});
    }
  
    // Update the connection data on other's user document
    async function updateConnectionData(targetUserId, payload) {
      const calleeDoc = doc(db, `rooms/${roomId}/RTCinfo/${targetUserId}/callees/${userId}`)
      await setDoc(calleeDoc, payload, { merge: true });
      console.log("update connection data:");
      console.log(payload);
    }

    async function connectNewUser(newUserId, remoteRTCoffer) {
      createNewPeerConnection(newUserId);
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

    function createNewPeerConnection(userId) {
      if (peerConnections.hasOwnProperty(userId)) return;
      peerConnections[userId] = {}
      peerConnections[userId].pc = new RTCPeerConnection(servers);
      // Push tracks from local stream to peer connection
      localStream.current.getTracks().forEach((track) => {
        console.log(`Pushing track ... ${(new Date()).getTime()}`)
        console.log(track)
        peerConnections[userId].pc.addTrack(track, localStream.current);
      });

      peerConnections[userId].audioStream = new MediaStream();
      peerConnections[userId].pc.ontrack = (event) => {
        console.log(`Getting track ... ${(new Date()).getTime()}`)
        event.streams[0].getTracks().forEach((track) => {
          peerConnections[userId].audioStream.addTrack(track);
        });
      };

      // Listen for any IceCandidate update and write to Firestore
      peerConnections[userId].pc.onicecandidate = (event) => {
        event.candidate && updateConnectionData(userId, {
          ICEcandidate: event.candidate.toJSON()
        });
      };
      peerConnections[userId].mute = false;
    }

    async function handleICEqueue(userId) {
      while (pendingICEcandidates.current[userId].length > 0) {
        const candidate = pendingICEcandidates.current[userId].pop();
        console.log('From ICE candidate queue:');
        console.log(candidate);
        await addICEcandidate(userId, candidate);
      }
    }

  }, [roomId, userId, initialized]);
  

  
  // Page UI
  if (!initialized) return (
    <HomePage>
      <div className="flex-1 p-10 text-2xl font-bold">
        Loading...
      </div>
    </HomePage>
  );
  return (
    <HomePage>
      <div className="flex-1 p-10 text-2xl font-bold">
        Room id: {roomId}
      </div>
      {Object.keys(peerConnections).map(userId => (
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
      
    </HomePage>
  );

  function connectAudio() {
    console.log("connecting Audio")
    Object.keys(peerConnections).map(userId => {
      const remoteAudio = document.getElementById(userId);
      console.log(`remoteAudio of ${userId}`)
      console.log(remoteAudio)
      console.log()
      remoteAudio.srcObject = peerConnections[userId].audioStream;
    })
    const callbackAudio = document.getElementById("callbackAudio");
    callbackAudio.srcObject = localStream.current;
  }

  function disconnectAudio() {
    console.log("Disconnecting Audio")
    Object.keys(peerConnections).map(userId => {
      const remoteAudio = document.getElementById(userId);
      remoteAudio.srcObject = null;
    })
    const callbackAudio = document.getElementById("callbackAudio");
    callbackAudio.srcObject = null;
  }

  async function leave() {
    await unsubscribe();
    const db = getFirestore();
    // remove user in Firestore
    const calleesDoc = collection(db, `rooms/${roomId}/RTCinfo/${userId}/callees`);
    /*
    const calleesDocSnapshot = await getDocs(calleesDoc);
    calleesDocSnapshot.forEach(async (docSnapshot) => {
      if (docSnapshot === undefined) return;
      await deleteDoc(docSnapshot.doc);
    });
    */
    await deleteDoc(doc(db, `rooms/${roomId}/RTCinfo/${userId}`));
    Router.push('/')
  }

  async function unsubscribe() {
    const db = getFirestore();
    const allUserDoc = collection(db, `rooms/${roomId}/RTCinfo`);
    const calleeDoc = collection(db, `rooms/${roomId}/RTCinfo/${userId}/callees`);
    onSnapshot(allUserDoc, () => {});
    onSnapshot(calleeDoc, () => {});
  }

  async function addICEcandidate(newUserId, ICEcandidate) {
    const candidate = new RTCIceCandidate(ICEcandidate);
    await peerConnections[newUserId].pc.addIceCandidate(candidate);
  }
}


const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};