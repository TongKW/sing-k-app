import * as fb from '../../../firebase/firebase_connect.js';
import React, { useState, useEffect, useRef } from 'react';
import {getRoom} from "../../../firebase/firebase_connect.js";
import {useRouter} from "next/router";


export default async function handler(req, res){
    console.log(req.body);
    const router = useRouter();
    const roomId = router.query.roomid;
    if (req.method === "GET") {
        console.log(req.body);
        console.log(roomId);
        const result = fb.getRoom(roomId);
        return res.status(200).json(result);
    }
    else if (req.method === "POST") {
        console.log(req.body);
        const roomID = req.body.roomID;
        const creatorID = req.body.creatorID;
        const type = req.body.type;
        const usersArray = req.body.usersArray;

        console.log(roomID, creatorID, type, usersArray);
        const result = fb.createRoom(roomID, creatorID, type, usersArray);
        return res.status(200).json(result);
    }
    else if (req.method === "PUT") {
        const {roomID,users_json} = req.body;
        const result = fb.createRoom(roomID,users_json);
        return res.status(200).json(result);
    }
    else if (req.method === "DELETE") {
        const {roomID} = req.body;
        const result = fb.delRoom(roomID);
        return res.status(200).json(result);
    }
}