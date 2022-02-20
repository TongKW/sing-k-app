/**
 * Validate the format of email
 * @param {string} email
 * @return {boolean}
 */
export default function validateFormat(email) {
  return Boolean(String(email).match(
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  ));
}