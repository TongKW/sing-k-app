import { MongoClient } from 'mongodb';

const uri = "mongodb://admin:admin@alexauwork.com:30000/";
const bcrypt = require('bcryptjs');

export default async function authenticate(req, res) {
  if (req.method === "POST") {
    const { username, password } = req.body;

    //load hash from MongoDb with username
    let user;
    let isExists = false;

    const client = new MongoClient(uri);
    await client.connect();
    var user_info = client.db("users").collection('user_info');

    // Check if the username exists
    const query = { "username": username };
    const result = user_info.find(query);
    
    await result.forEach((result) => { isExists = true; user = result; console.log(user) });
    await client.close();
    // if the username does not exist in the db
    if (!isExists) {
      return res.status(409).json({
        message: "User not found"
      });
    }
    // if the password hash does not match
    if (!bcrypt.compareSync(password, user.hash)) {
      return res.status(409).json({
        message: "Password incorrect"
      });
    }
    // Successfully logged in
    return res.status(200).json({
      id: user._id,
    });
  }
}