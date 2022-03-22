import { initializeApp } from 'firebase/app';
import { getFirestore,collection,getDocs  } from "firebase/firestore";
import { firebaseConfig } from './config.js';
initializeApp(firebaseConfig);
const db = getFirestore();


export async function getRoomList() {
    var querySnapshot  = await getDocs(collection(db,'rooms'));
    var result = [];
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        result.push(doc.id);
        console.log(doc.id, " => ", doc.data());
    });
    /*
    const collectionIds = querySnapshot.docs.map(doc => {doc.id, doc.data()});
    console.log("collectionIds",collectionIds);
    console.log("id_type_pair_list",id_type_pair_list);
    */
    console.log(result);
    return result;
}

export async function getPublicRoomList() {
    var querySnapshot  = await getDocs(collection(db,'rooms'));
    console.log("querySnapshot",querySnapshot);

    var result = [];
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        if (doc['type'] == 'public') {
            result.push(doc.id);
        }
    });
    return result;
}

export async function getPrivateRoomList() {
    var querySnapshot  = await getDocs(collection(db,'rooms'));
    console.log("querySnapshot",querySnapshot);

    var result = [];
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        if (doc['type'] == 'private') {
            result.push(doc.id);
        }
    });
    return result;
}

export async function getRoom(roomId) {
    var rooms = db.collection('/rooms/'+roomId).listCollections();
    const roomIds = rooms.map(col => col.id);
    return { collections: collectionIds };
}

export async function createRoom(roomId, users_json) {
    var ref = db.collection('rooms').doc(roomId);

    ref.set(users_json).then(() => {
        console.log('set data successful');
    });

}

export async function delRoom(roomId) {
    var ref = db.collection('rooms').doc(roomId);

    ref.delete().then(() => {
        console.log('delete data successful');
    });
}

export async function delUserFromRoom(roomId, userId) {
    var ref = db.collection('/rooms/'+roomId+'/').doc(user);

    ref.delete().then(() => {
        console.log('delete data successful');
    });
}

