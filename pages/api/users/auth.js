import { MongoClient } from "mongodb";
import sign_token from "../../../utils/jwt/sign";
import getConfig from "next/config";

const uri = process.env.MONGODB_SERVER;
const bcrypt = require("bcryptjs");
const { serverRuntimeConfig } = getConfig();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { username, password } = req.body;

    //load hash from MongoDb with username
    let user;
    let isExists = false;

    const client = new MongoClient(uri);
    await client.connect();
    var user_info = client.db("users").collection("user_info");

    // Check if the username exists
    const query = { username: username };
    const result = user_info.find(query);

    await result.forEach((result) => {
      isExists = true;
      user = result;
      //console.log(user);
    });
    await client.close();
    // if the username does not exist in the db
    if (!isExists) {
      //console.log("User not found");
      return res.status(200).json({
        message: "User not found",
        success: false,
      });
    }
    // if the password hash does not match
    if (!bcrypt.compareSync(password, user.hash)) {
      //console.log("Password incorrect");
      return res.status(200).json({
        message: "Password incorrect",
        success: false,
      });
    }
    // successfully logged in
    // set cookie and return signed jwt
    //console.log("successfully logged in");
    var secret = serverRuntimeConfig.jwt_secret;
    var payload = {
      id: user._id,
      username: username,
      email: user.email,
      avatar: user.avatar,
    };
    // Create a jwt expires in 30 days
    var token = sign_token(payload, secret, 30);
    res.setHeader(
      "Set-Cookie",
      `isLogin=${true}; username=${username}; path=/;`
    );
    return res.status(200).json({
      message: "Successfully logged in",
      success: true,
      token: token,
    });
  }
}
