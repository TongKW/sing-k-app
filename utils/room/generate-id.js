import { getDoc, doc, getFirestore } from "firebase/firestore";
import firebase from "firebase/compat/app";
import { firebaseConfig } from '../../firebase/config';

// Generate alphanumeric random string of 6 characters
function generateRandomString() {
  // [65, 66, ..., 90]
  const lowerCaseAscii = Array(26).fill(65).map((x, y) => x + y);
  // [97, 98, ..., 122]
  const upperCaseAscii = Array(26).fill(97).map((x, y) => x + y);
  // [48, 49, ..., 57]
  const numberAscii = Array(10).fill(48).map((x, y) => x + y);
  const pool = [...lowerCaseAscii, ...upperCaseAscii, ...numberAscii];
  let roomId = "";
  [...Array(6)].map((_) => roomId += String.fromCharCode(pool[Math.floor(Math.random()*pool.length)]));
  return roomId;
}

export default async function generateRoomId() {
  // Initialize Firebase 
  const app = firebase.initializeApp(firebaseConfig);
  const db = getFirestore();
  let roomId = generateRandomString();
  // check if firestore already has this roomId
  const snapshot = await getDoc(doc(db, `rooms/${roomId}`));
  return snapshot.exists() ? (await generateRoomId()) : roomId;
}