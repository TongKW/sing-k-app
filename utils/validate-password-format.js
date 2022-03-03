/**
 * Validate the format of password
 * @param {string} password
 * @return {boolean}
 */
function validatePwFormat(password) {
  return Boolean(
    String(password).match(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/
    )
  );
}

export default function pwValidateSetError(password, setPwError, ...setErrors) {
  if (!validatePwFormat(password)) {
    setPwError(
      "Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character"
    );
    setErrors.forEach((errorSet) => errorSet());
    return true;
  }
  return false;
}
