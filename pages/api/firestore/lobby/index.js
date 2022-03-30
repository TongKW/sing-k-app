import * as fb from '../../../../firebase/firebase_connect.js';

export default async function handler(req, res){
    if (req.method === "GET") {
        const all_result = fb.getRoomList();
        const public_result = fb.getPublicRoomList();
        const private_result = fb.getPrivateRoomList();
        var json_result_val = {};
        await all_result.then((val)=>{
            json_result_val['all'] = val;
        });
        await private_result.then((val)=>{
            json_result_val['private'] = val;
        });
        await public_result.then((val)=>{
            json_result_val['public'] = val;
        });

        return res.status(200).json(json_result_val);

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
        const roomID = req.body.roomID;
        let change_json = req.body;
        delete change_json.roomID;
        console.log("roomID",roomID, "change_json",change_json);
        const result = fb.changeRoom(roomID,change_json);
        return res.status(200).json(change_json);
    }
    else if (req.method === "DELETE") {
        const {roomID} = req.body;
        const result = fb.delRoom(roomID);
        return res.status(200).json(result);
    }

}