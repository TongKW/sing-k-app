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

    //TODO: Hash the password if there is any in the request body


    //TODO: Find the user in user_info and update it to MongoDb


    return res.status(200).json({
      success: true
    });
  }
}