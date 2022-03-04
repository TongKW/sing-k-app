// Still have bugs to be solved

import sleep from '../../sleep';
/**
 * 
 * @param {}
 * @return {}
 */
export default async function initPeerConnection(localStream) {
  let pc = new RTCPeerConnection(servers);
  let iceCandidate = null;

  // Create offer descript and set to local
  let description = await pc.createOffer();
  let offer = {
    sdp: description.sdp,
    type: description.type,
  };
  await pc.setLocalDescription(description);

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      iceCandidate = event.candidate.toJSON();
    }
  };

  while (!iceCandidate) {
    // wait until iceCandidate is got
    sleep(10);
  }

  return [pc, offer, iceCandidate];
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};