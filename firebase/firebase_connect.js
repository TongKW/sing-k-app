import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { firebaseConfig } from "./config.js";

initializeApp(firebaseConfig);
const db = getFirestore();

// This function is returning the list of rooms in the firebase
export async function getRoomList() {
  var querySnapshot = await getDocs(collection(db, "rooms"));
  var result = [];
  querySnapshot.forEach((doc) => {
    result.push(doc.id);
  });
  return result;
}

// This function is returning the list of public rooms in the firebase
export async function getPublicRoomList() {
  var querySnapshot = await getDocs(collection(db, "rooms"));
  var result = [];
  querySnapshot.forEach((doc) => {
    if (doc.data()["type"] === "public") {
      result.push(doc.id);
    }
  });
  return result;
}

// This function is returning the list of private room in the firebase
export async function getPrivateRoomList() {
  var querySnapshot = await getDocs(collection(db, "rooms"));
  var result = [];
  querySnapshot.forEach((doc) => {
    if (doc.data()["type"] === "private") {
      result.push(doc.id);
    }
  });
  return result;
}

// This function is returning the all document of collection in the firebase with the parameter roomID
export async function getRoom(roomId) {
  var querySnapshot = await getDocs(collection(db, "rooms", roomId));
  var result = [];
  querySnapshot.forEach((doc) => {
    result.push(doc);
  });
  return result;
}

// This function is creating a document in the firebase
export async function createRoom(roomID, creatorID, type, usersArray) {
  await setDoc(doc(db, "rooms", roomID), {
    creator: creatorID,
    type: type,
  });
}

// This function is deleting a document by the roomID in the firebase
export async function delRoom(roomID) {
  await deleteDoc(doc(db, "rooms", roomID));
}

// This function is updating a document in the firebase, by the parameter json `changes`
export async function changeRoom(roomID, changes) {
  await updateDoc(doc(db, "rooms", roomID), changes);
}

// This function is delUserFromRoom a specific user from a room in the firebase
export async function delUserFromRoom(roomId, userId) {
  var ref = db.collection("/rooms/" + roomId + "/").doc(user);

  ref.delete().then(() => {});
}
