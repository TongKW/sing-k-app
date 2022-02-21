import { MongoClient } from 'mongodb';

const uri = "mongodb://admin:admin@alexauwork.com:30000/";
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  if (req.method === "POST") {
    let validate_id;
    const { username, password, email } = req.body;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
  
    const client = new MongoClient(uri);
    await client.connect();
    var user_info = client.db("users").collection('user_info');
    var validate = client.db("users").collection('validate');

    // Check if the username exists
    var usernameExists = false;
    var emailExists = false;
    await user_info.find({ "username": username }).forEach(() => { usernameExists = true; });
    await validate.find({ "username": username }).forEach(() => { usernameExists = true; });
    await user_info.find({ "email": email }).forEach(() => { emailExists = true; });
    await validate.find({ "email": email }).forEach(() => { emailExists = true; });
    if (usernameExists || emailExists) {
      // username or email exists, return
      return res.status(200).json({
        success: false,
        usernameExists: usernameExists,
        emailExists: emailExists,
      });
    }

    // Put user into validation waitlist
    // username: string
    // email: string
    // hash: hashed user pw by bcrypt.hashSync with salt
    // expireTime: int, milliseconds since Epoch till now + 24 hours
    const user = { username: username, hash: hash, email: email, expireTime: Date.now()+86400000 }
    await validate.insertOne(user).then(result => {
      validate_id = result.insertedId;
    }).catch(err => {
      console.log(err);
      return res.status(200).json({
        success: false,
        message: "Unknown error"
      });
    });
    await client.close();
    
    // Return success status with validate_id
    return res.status(200).json({
      success: true,
      validate_id: validate_id
    });
  }
  
}