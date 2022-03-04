export default function checkFileSize(base64) {
  // given a base64 string, return the width and height of the image
  const fileSize = base64.length * (3 / 4) - 2;
  return fileSize;
}
