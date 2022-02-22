/**
 * Verification of jwt token. 
 * Return { authorized: true, body: <decoded token> } if token is valid.
 * Return { authorized: false } if token/key is invalid
 * @param {string} token - The json web token
 * @param {string} secret_key - The secret key used to sign the token
 * @return {Object}
 */
export default function verify_token(token, secret_key) {
  var jwt = require('jsonwebtoken');
  try {
    var decoded = jwt.verify(token, secret_key);
    return { authorized: true, body: decoded };
  } catch(err) {
    return { authorized: false };
  }
}