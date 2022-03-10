import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router'
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
import initPeerConnection from '../../utils/webrtc/peer-connection/init';
import connect from '../../utils/webrtc/peer-connection/connect';


export default function Room() {
  // Routing parameter
  const router = useRouter();
  const roomId = router.query.id;

  // WebRTC info and Stream parameters for the next newcomer
  let localStream = useRef(null);
  let remoteStream = useRef(null);
  let pc = useRef(null);

  // Peer connection variables
  let peerConnections = useRef({})
  console.log('Peer RTC Info:')
  console.log(peerConnections.current);

  // Initialization indicates
  const [initialized, setInitialized] = useState(false);

  // User info
  const [username, setUsername] = useState();
  const [avatar, setAvatar] = useState();
  const [userId, setUserId] = useState();

  // Initialize Firebase 
  const app = firebase.initializeApp(firebaseConfig);
  
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
        console.log(`userId: ${user.id}`)
      } else {
        // Unauthorized user or jwt expired
        // Prompt to login page
        router.push('/login');
      }
    }
  }, [router]);

  // Initialize audio stream and WebRTC
  // Get peer WebRTC info and connect
  useEffect(() => {
    if (!initialized && roomId && userId) {
      initialize();
    }
    async function initialize() {
      console.log('initalizing...')
      
      // Setup audio
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

      // Get Firebase
      const db = getFirestore();
      console.log(`roomId: ${roomId}`)
      const roomDoc = doc(db, "rooms", roomId);
      const roomSnapshot = await getDoc(roomDoc);
      const roomType = roomSnapshot.data().type;
      console.log(roomType);

      const allUserDocs = collection(db, `rooms/${roomId}/RTCinfo`);
      const allUserSnapshot = await getDocs(allUserDocs);
      
      allUserSnapshot.forEach(async (docSnapshot) => {
        // Create one WebRTC Peer Connection for every other user
        // Update Peer Connection detail to Firestore
        const userDoc = doc(db, `rooms/${roomId}/RTCinfo/${docSnapshot.id}`);
        const [pc, FromRTCOffer, FromICEcandidate, remoteStream] = await initPeerConnection(localStream.current);
        peerConnections.current[docSnapshot.id] = {pc: pc, audioStream: remoteStream};
        await updateDoc(userDoc, {
          FromICEcandidate: FromICEcandidate,
          FromRTCoffer: FromRTCOffer,
        });
      });
      
      

      // Write Firebase to update offer
      console.log(userId)
      await createNewOffer(db);

      // Listen for any new user
      const userDoc = doc(db, `rooms/${roomId}/RTCinfo/${userId}`)
      onSnapshot(allUserDocs, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          console.log(change);
          // If a new user joined, connect with WebRTC
          if (change.type === 'added') {
            const userDocSnapshot = await getDoc(userDoc);
            if (userDocSnapshot.id === userId) return;
            console.log('new user joined')
            const fromICEcandidate = userDocSnapshot.data().FromICEcandidate
            const fromRTCoffer = userDocSnapshot.data().FromRTCOffer
            await connect(pc.current, fromICEcandidate, fromRTCoffer);

            // Store remote stream and peerConnection
            peerConnections.current[userDocSnapshot.id] = {pc: pc.current, audioStream: remoteStream.current}

            // Create new offer and update to Firestore
            await createNewOffer(db);
          }
          // If an user left, delete info and close the WebRTC connection
          if (change.type === 'removed') {
            const userDocSnapshot = await getDoc(userDoc);
            if (userDocSnapshot.id === userId) return;
            // Close WebRTC connection
            peerConnections.current[userDocSnapshot.id].pc.close()
            // delete user info
            delete peerConnections.current[userDocSnapshot.id]
          }
        });
      })

      setInitialized(true);
    }

    // When unmounted, remove user in Firestore
    return async () => {
      const db = getFirestore();
      // remove user in Firestore
      await deleteDoc(doc(db, `rooms/${roomId}/RTCinfo/${userId}`));
    };
  }, [roomId]);

  
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
      <audio autoPlay={true}>
        <source type="audio/ogg"/>
      </audio>
    </HomePage>
  );

  async function createNewOffer(db) {
    const userDoc = doc(db, `rooms/${roomId}/RTCinfo/${userId}`)
    let RTCoffer, ICEcandidate;
    [pc.current, RTCoffer, ICEcandidate, remoteStream.current] = await initPeerConnection(localStream.current)
    await setDoc(userDoc, {
      ICEcandidate: ICEcandidate,
      RTCoffer: RTCoffer,
    });
  }
}