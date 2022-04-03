export default async function getUserId() {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/jwt/decrypt", {
    method: "POST",
    body: JSON.stringify({ token: token }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (data.authorized) {
    const user = data.body;

    return user.id;
  }
  return null;
}

export async function setUsernameAvatar(setUsername, setAvatar) {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/jwt/decrypt", {
    method: "POST",
    body: JSON.stringify({ token: token }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (data.authorized) {
    const user = data.body;
    setAvatar(user.avatar);
    setUsername(user.username);
    return user.id;
  }
  return null;
}
