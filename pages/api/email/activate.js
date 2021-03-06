import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs'
import path from 'path'

const uri = process.env.MONGODB_SERVER;

export default async function handler(req, res) {
  if (req.method === "POST") {
    /*
    This function is handling http POST request to path /api/email/activate, to
    activate a user account. It does the following things:
    1. Get the validate_id from the request body.
    2. Connect to the mongoDB.
    3. Validate the activating request by check the data in mongoDB.
    4. Create an account for the validated user.
     */
    const { validate_id } = req.body;
    let data;

    const client = new MongoClient(uri);
    await client.connect();
    const user_info = client.db("users").collection('user_info');
    const validate = client.db("users").collection('validate');

    try {
      data = await validate.findOneAndDelete({'_id': ObjectId(validate_id)});
    } catch (error) {
      return res.status(200).json({
        message: "Invalid activation link."
      });
    }
    const user = data.value;

    // Check if the result is null
    if (!data) {
      return res.status(200).json({
        message: "Invalid activation link."
      });
    }

    // Check if the activation link is expired
    if (Date.now() > user.expireTime) {
      return res.status(200).json({
        message: "Activation link expired."
      });
    }

    // Get anonymous avatar base64
    const avatar_path = path.join(path.resolve('./public'), 'avatar.txt')
    const anony_avatar_base64 = fs.readFileSync(avatar_path).toString();

    // Create account
    const new_user = { 
      username: user.username, 
      hash: user.hash, 
      email: user.email, 
      avatar: anony_avatar_base64,
    }
    await user_info.insertOne(new_user);

    return res.status(200).json({
      message: "Successfully created account"
    });
  }
}