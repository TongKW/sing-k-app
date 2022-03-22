import * as fb from '../../firebase/firebase_connect.js';
import nodemailer from "nodemailer";

export default async function handler(req, res){
    const result = fb.getRoomList();
    return res.status(200).json(result);
}