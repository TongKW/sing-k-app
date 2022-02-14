import { MongoClient } from 'mongodb';
import { cors } from '../cors';

const uri = "mongodb://admin:admin@alexauwork.com:30000/";
const bcrypt = require('bcryptjs');

export default async function register(req, res) {
  await cors(req, res);
  if (req.method === "POST") {
    let id;
    const { username, password } = req.body;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
  
    //TODO: insert hash, username to MongoDb
    const client = new MongoClient(uri);
    await client.connect();
    var user_info = client.db("users").collection('user_info');

    // Check if the username exists
    const query = { "username": username };
    const result = user_info.find(query);
    var isExists = false;
    await result.forEach(() => { isExists = true; });
    if (isExists) {
      // username exists, return
      return res.status(200).json({
        success: false,
        message: "Username has been used"
      });
    }

    // Register a new user
    const user = { username: username, hash: hash }
    await user_info.insertOne(user).then(result => {
      id = result.insertedId;
      console.log(result.insertedId);
    }).catch(err => {
      console.log(err);
    });
    await client.close();
    
    // return basic user details and token
    return res.status(200).json({
      success: true
    });
  }
  
}