import { getDoc, updateDoc, doc } from "firebase/firestore";
export default async function removeUserQueue(db, userId, roomId) {
  const roomIdDoc = doc(db, `rooms/${roomId}`);
  const roomIdSnapshot = await getDoc(roomIdDoc);
  const roomIdData = roomIdSnapshot.data();
  const queue = roomIdData.queue;
  const newQueue = queue.filter((id) => id !== userId);
  await updateDoc(roomIdDoc, { queue: newQueue });
}
