import * as fb from '../../../../firebase/firebase_connect.js';

export default async function handler(req, res) {
    /*
    This function is handling http request to path /api/firestore/lobby/index, to create,
    read, update or delete rooms information for the lobby to show
     */
    if (req.method === "GET") {
        /*
        This block is handling GET request.
        1. Get list of all room, list of all public room, list of all private room
        2. Form a json with those three lists and return
        */
        const all_result = fb.getRoomList();
        const public_result = fb.getPublicRoomList();
        const private_result = fb.getPrivateRoomList();
        var json_result_val = {};
        await all_result.then((val) => {
            json_result_val['all'] = val;
        });
        await private_result.then((val) => {
            json_result_val['private'] = val;
        });
        await public_result.then((val) => {
            json_result_val['public'] = val;
        });

        return res.status(200).json(json_result_val);

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
        const roomID = req.body.roomID;
        let change_json = req.body;
        delete change_json.roomID;
        const result = fb.changeRoom(roomID, change_json);
        return res.status(200).json(change_json);
    } else if (req.method === "DELETE") {
        /*
        This block is handling DELETE request. It deletes the as specified from the
        request and return the result
        */
        const {roomID} = req.body;
        const result = fb.delRoom(roomID);
        return res.status(200).json(result);
    }

}