import { Loading } from "notiflix";

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    Loading.circle({ svgColor: "#283593" });
    reader.onloadend = () => {
      resolve(reader.result);
      Loading.remove();
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function processFile(file) {
  try {
    const fileContent = await readFileAsync(file);
    return { success: true, content: fileContent };
  } catch (error) {
    return { success: false, content: error };
  }
}

export function checkFileSize(base64) {
  // given a base64 string, return the width and height of the image
  const fileSize = base64.length * (3 / 4) - 2;
  return fileSize;
}