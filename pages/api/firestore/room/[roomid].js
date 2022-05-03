import * as fb from '../../../../firebase/firebase_connect.js';
import {changeRoom, getRoom} from "../../../../firebase/firebase_connect.js";
import {useRouter} from "next/router";


export default function handler(req, res) {
    /*
    This function is handling http request to path /api/firestore/room/[roomid], to create,
    read, update or delete room. The `roomid` in the url will be a query parameter in the handler.
    */
    if (req.method === "GET") {
        /*
        This block is handling GET request. It returns a json which is the information of
        the specified room of roomid.
        */
        const roomId = req.query.roomid;
        const result = fb.getRoom(roomId);
        return res.status(200).json(result);
    } else if (req.method === "POST") {
        /*
        This block is handling POST request. It accepts an input json with field `roomID`,
        `creatorID`, `type`, `usersArray`. It creates a room and return the result.
        */
        const roomID = req.body.roomID;
        const creatorID = req.body.creatorID;
        const type = req.body.type;
        const usersArray = req.body.usersArray;
        const result = fb.createRoom(roomID, creatorID, type, usersArray);
        return res.status(200).json(result);
    } else if (req.method === "PUT") {
        /*
        This block is handling PUT request. It accepts an input json with field `roomID`,
        `body`. It modifies the room according to the content of `body` and return the result.
        */
        const {roomID, change_json} = req.body;
        const result = fb.changeRoom(roomID, change_json);
        return res.status(200).json(change_json);
    } else if (req.method === "DELETE") {
        /*
        This block is handling DELETE request. It deletes the as specified from the
        request and return the result
        */
        const roomID = req.query.roomid;
        const result = fb.delRoom(roomID);
        return res.status(200).json(result);
    }
}