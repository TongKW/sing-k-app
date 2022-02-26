import { MongoClient } from 'mongodb';

const uri = "mongodb://admin:admin@alexauwork.com:30000/";
const bcrypt = require('bcryptjs');

/**
 * Update part of user information to db given by the request body
 * If body contains password (eg. {password: "123", ...}, hash the password before updating )
 * @param {Object} - The
 * @return {import('next').NextApiResponse} - Api Response
 */
export default async function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body;

    var user = {};

    if(!body.hasOwnProperty('username') ){
      return res.status(200).json({
        success: false,
        message: "No Username in request"
      });
    }

    //Hash the password Check do the request body contain there is any in the request body
    if(body.hasOwnProperty('password')){
      const password = body.password;
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(password, salt);
      user.hash = hash;
    }

    //put every field from `body` to `user`
    console.log("DEBUG MSG 2");
    for (var key in body) {
      console.log(key);
      console.log(body[key]);
      if (key!='password' && key!='username'){
        user[key] = body[key];
      }
    }
    console.log(user);
    //connect MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    var user_info = client.db("users").collection('user_info');

    // Check if the username exists
    var query = { "username": body.username };
    const result = user_info.find(query);
    var isExists = false;
    await result.forEach(() => { isExists = true; });
    if (!isExists) {
      // username exists, return
      return res.status(200).json({
        success: false,
        message: "User doesn't exist"
      });
    }

    //update mongodb
    var newvalues = { $set: user };
    await user_info.updateOne(query, newvalues).then(result => {
      console.log(result);
    }).catch(err => {
      console.log(err);
    });

    await client.close();

    return res.status(200).json({
      success: true
    });
  }
}