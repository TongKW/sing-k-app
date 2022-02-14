export default function logout() {
  // Set a cookie with expires time to remove cookie
  document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  // Remove local storage items
  localStorage.removeItem('username');
  localStorage.removeItem('image');
  // Refresh page
  window.location.reload();
}