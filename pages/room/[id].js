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
  getFirestore
} from "firebase/firestore";
import { firebaseConfig } from '../../firebase/config';
//import initPeerConnection from '../../utils/webrtc/peer-connection/init';


export default function Room() {
  const router = useRouter();
  const roomId = router.query.id;
  const localStream = useRef(null);
  const [initialized, setInitialized] = useState(false);

  // RTC connection variables
  let peerConnection = useRef(null);
  let RTCoffer = useRef(null);
  let ICEcandidate = useRef(null);
  let peerRTCinfo = {};
  console.log('Peer RTC Info:')
  console.log(peerRTCinfo);

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
    if (!initialized) {
      initialize();
    }
    if (initialized) {
      const callback = document.getElementById('callback');
      if (callback) {
        callback.srcObject = localStream.current;
      }
    }
    async function initialize() {
      console.log('initalizing...')
      
      // Setup audio
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      // Setup RTC connection
      [peerConnection.current, RTCoffer.current, ICEcandidate.current] = await initPeerConnection(localStream.current);
      console.log(ICEcandidate.current);
      console.log(RTCoffer.current)
      

      // Get Firebase
      const db = getFirestore();
      console.log(roomId);
      const roomDoc = doc(db, "rooms", roomId);
      const roomSnapshot = await getDoc(roomDoc);
      const roomType = roomSnapshot.data().type;
      console.log(roomType);

      const allUserDocs = collection(db, `rooms/${roomId}/RTCinfo`);
      const allUserSnapshot = await getDocs(allUserDocs);
      allUserSnapshot.forEach((doc) => {
        peerRTCinfo[doc.id] = { 
          ICEcandidate: doc.data().ice, 
          RTCoffer: doc.data().RTCoffer
        }
      });

      // Write Firebase
      console.log(userId)
      const userDoc = doc(db, `rooms/${roomId}/RTCinfo`, userId)
      await setDoc(userDoc, {
        ICEcandidate: ICEcandidate.current,
        RTCoffer: RTCoffer.current
        //ICEcandidate: {test: 'test'},
        //RTCoffer: {test: 'test'}
      });

      

      
      setInitialized(true);
    }

    // When unmounted, remove user in Firestore
    return () => {
      // remove user in Firestore
    };
  });

  
  

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
}