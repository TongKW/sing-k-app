/**
 * Creation of jwt token. 
 * @param {Object} payload - the to-be-encrypted object
 * @param {string} secretkey - The secret key used to sign the token
 * @param {int} expireDays - days that the jwt token expires in
 * @return {string}
 */
export default function sign_token(payload, secretkey, expireDays) {
  var jwt = require('jsonwebtoken');
  var token = jwt.sign(payload, secretkey, { expiresIn: `${expireDays}d` });
  return token;
}