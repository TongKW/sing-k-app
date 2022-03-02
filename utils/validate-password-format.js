/**
 * Validate the format of password
 * @param {string} password
 * @return {boolean}
 */
export default function validatePwFormat(password) {
  return Boolean(
    String(password).match(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/
    )
  );
}
