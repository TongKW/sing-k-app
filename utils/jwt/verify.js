/**
 * Verification of jwt token. 
 * Return { authorized: true, body: <decoded token> } if token is valid.
 * Return { authorized: false } if token/key is invalid
 * @param {string} token - The json web token
 * @param {string} secretkey - The secret key used to sign the token
 * @return {Object}
 */
export default function verify_token(token, secretkey) {
  var jwt = require('jsonwebtoken');
  try {
    var decoded = jwt.verify(token, secretkey);
    return { authorized: true, body: decoded };
  } catch(err) {
    return { authorized: false };
  }
}