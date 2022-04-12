import { MongoClient, ObjectId } from 'mongodb';
import nodemailer from "nodemailer";
import getConfig from 'next/config'

const uri = process.env.MONGODB_SERVER;
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  // POST => user request for password reset
  // If user info is valid, send reset id to user's email
  if (req.method === "POST") {
    const { username, email } = req.body;
    let reset_id;

    const client = new MongoClient(uri);
    await client.connect();
    const user_info = client.db("users").collection('user_info');
    const reset_pw = client.db("users").collection('reset_pw');

    // Check if user info is correct
    const query = { "username": username, "email": email };
    const result = await user_info.findOne(query);
    //console.log(result);

    if (!result) {
      return res.status(200).json({
        success: false,
        message: "Username or email is incorrect."
      });
    }

    // Insert into reset pw waitlist
    // username: string
    // email: string
    // expireTime: int, milliseconds since Epoch till now + 24 hours
    const user = { username: username, email: email, expireTime: Date.now()+86400000 }
    await reset_pw.insertOne(user).then(result => {
      reset_id = result.insertedId;
    }).catch(err => {
      //console.log(err);
      return res.status(200).json({
        success: false,
        message: "Unknown error occurred"
      });
    });
    await client.close();

    // Send reset password link to user email
    const url = `https://sing-k-app.vercel.app/login/reset-password?reset_id=${reset_id}`
    var message = {
      from: "enjoy.singing.karaoke@gmail.com",
      to: email,
      subject: "Reset password of your karaoke account at sing-k-app.vercel.app",
      text:`Hi ${username},\n\nClick the below link to reset password:\n${url}\n\n-- Karaoke App Team`,
    };
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'enjoy.singing.karaoke@gmail.com',
          pass: process.env.EMAIL_PW
      }
    });
    await transporter.sendMail(message);

    return res.status(200).json({
      success: true,
    });
  }

  // PUT => confirmation of users's reset pw request
  // Verify the reset_id and update new password
  if (req.method === "PUT") {
    const { reset_id, new_pw } = req.body;

    // Connect MongoDb Server
    const client = new MongoClient(uri);
    await client.connect();
    const user_info = client.db("users").collection('user_info');
    const reset_pw = client.db("users").collection('reset_pw');

    // Find and delete user stored in reset_pw
    const query = { "_id": ObjectId(reset_id) };
    const result = await reset_pw.findOneAndDelete(query);

    // If no reset_id found in reset_pw
    if (!result.value) {
      return res.status(200).json({
        success: false,
        message: "Invalid reset ID."
      });
    }
    // If expired
    if (Date.now() > result.value.expireTime) {
      return res.status(200).json({
        success: false,
        message: "Reset password link expired."
      });
    }


    // Create hash for new password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_pw, salt);
    // If reset_id is valid
    // Update new password hash to user_info
    await user_info.updateOne({"username" : result.value.username}, {$set: {"hash": hash}});

    // Close MongoDb Server Connection
    await client.close();

    return res.status(200).json({
      success: true,
      message: "Password has been successfully reset."
    });
  }
}