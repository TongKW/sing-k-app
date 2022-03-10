import sleep from '../../sleep';
/**
 * 
 * @param {}
 * @return {}
 */
export default async function initPeerConnection(localStream) {
  const pc = new RTCPeerConnection(servers);
  let remoteStream = new MediaStream();
  let iceCandidate = null;
  console.log(`localStream: ${localStream}`)

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  pc.onicecandidate = (event) => {
    event.candidate && (iceCandidate = event.candidate.toJSON());
  };

  // Create offer descript and set to local
  let description = await pc.createOffer();
  let offer = {
    sdp: description.sdp,
    type: description.type,
  };
  await pc.setLocalDescription(description);

  while (!iceCandidate) {
    // wait until iceCandidate is got
    await sleep(5);
  }

  return [pc, offer, iceCandidate, remoteStream];
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};