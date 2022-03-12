/**
 * 
 * @param {}
 * @return {}
 */
export default async function connect(myPc, offer, iceCandidate) {
  console.log(`CONNECT: ${iceCandidate}`)
  const desc = new RTCSessionDescription(offer);
  const candidate = new RTCIceCandidate(iceCandidate);
  await myPc.setRemoteDescription(desc);
  await myPc.addIceCandidate(candidate);
}