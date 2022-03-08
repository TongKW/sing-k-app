export default async function listenTo(myPc, remoteStream) {
  // Pull tracks from remote stream, add to video stream
  myPc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };
}