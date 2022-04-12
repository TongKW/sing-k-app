import * as fb from '../../../../firebase/firebase_connect.js';
import {changeRoom, getRoom} from "../../../../firebase/firebase_connect.js";
import {useRouter} from "next/router";


export default function handler(req, res) {
    if (req.method === "GET") {
        const roomId = req.query.roomid;
        //console.log(roomId);
        const result = fb.getRoom(roomId);
        return res.status(200).json(result);
    } else if (req.method === "POST") {
        //console.log(req.body);
        const roomID = req.body.roomID;
        const creatorID = req.body.creatorID;
        const type = req.body.type;
        const usersArray = req.body.usersArray;

        //console.log(roomID, creatorID, type, usersArray);
        const result = fb.createRoom(roomID, creatorID, type, usersArray);
        return res.status(200).json(result);
    } else if (req.method === "PUT") {
        const {roomID, change_json} = req.body;
        //console.log(roomID, change_json);
        const result = fb.changeRoom(roomID, change_json);
        return res.status(200).json(change_json);
    } else if (req.method === "DELETE") {
        const {roomID} = req.body;
        const result = fb.delRoom(roomID);
        return res.status(200).json(result);
    }
}