import {initializeApp} from 'firebase/app';
import {getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc} from "firebase/firestore";
import {firebaseConfig} from './config.js';

initializeApp(firebaseConfig);
const db = getFirestore();


export async function getRoomList() {
    var querySnapshot = await getDocs(collection(db, 'rooms'));
    var result = [];
    querySnapshot.forEach((doc) => {
        result.push(doc.id);
        console.log("getRoomList", doc.id, " => ", doc.data());
    });
    console.log(result);
    return result;
}

export async function getPublicRoomList() {
    var querySnapshot = await getDocs(collection(db, 'rooms'));
    var result = [];
    querySnapshot.forEach((doc) => {
        if (doc.data()['type'] === 'public') {
            result.push(doc.id);
        }
    });
    return result;
}

export async function getPrivateRoomList() {
    var querySnapshot = await getDocs(collection(db, 'rooms'));
    var result = [];
    querySnapshot.forEach((doc) => {
        if (doc.data()['type'] === 'private') {
            result.push(doc.id);
        }
    });
    return result;
}

export async function getRoom(roomId) {
    var querySnapshot = await getDocs(collection(db, 'rooms', roomId));
    var result = [];
    querySnapshot.forEach((doc) => {
        result.push(doc);
    });
    return result;
}

export async function createRoom(roomID, creatorID, type, usersArray) {
    console.log(roomId);
    await setDoc(doc(db, "rooms", roomID), {
        creator: creatorID,
        type: type
    });
}

export async function delRoom(roomID) {
    await deleteDoc(doc(db, "rooms", roomID));
}

export async function changeRoom(roomID, changes) {

    await updateDoc(doc(db, "rooms", roomID), changes);
}

export async function delUserFromRoom(roomId, userId) {
    var ref = db.collection('/rooms/' + roomId + '/').doc(user);

    ref.delete().then(() => {
        console.log('delete data successful');
    });
}
