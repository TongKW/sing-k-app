//A utility function that pads the digit of date to 2 for consistent date length
function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

// A utility function that formats the date to a standard ISO but human readable format
export default function formatDate(date) {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("/") +
    " " +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(":")
  );
}

export function formatTime(date) {
  return [
    padTo2Digits(date.getHours()),
    padTo2Digits(date.getMinutes()),
    padTo2Digits(date.getSeconds()),
  ].join(":");
}
