import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_SERVER;
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
    let { id, password, ...user } = body;

    if(!body.hasOwnProperty('id') ){
      return res.status(200).json({
        success: false,
        message: "No id in request"
      });
    }

    //Hash the password Check do the request body contain there is any in the request body
    if(body.hasOwnProperty('password')){
      const password = body.password;
      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(password, salt);
      user.hash = hash;
    }

    //connect MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    let user_info = client.db("users").collection('user_info');

    // Check if the username exists
    let query = { "_id": ObjectId(id) };
    const result = user_info.find(query);
    let isExists = false;
    await result.forEach(() => { isExists = true; });
    if (!isExists) {
      // username exists, return
      return res.status(200).json({
        success: false,
        message: "User doesn't exist"
      });
    }

    //update mongodb
    let newvalues = { $set: user };
    await user_info.updateOne(query, newvalues).then(result => {
      //console.log(result);
    }).catch(err => {
      //console.log(err);
    });

    await client.close();

    return res.status(200).json({
      success: true
    });
  }
}