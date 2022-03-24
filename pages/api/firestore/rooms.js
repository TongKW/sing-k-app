import * as fb from '../../../firebase/firebase_connect.js';
import {delRoom, getPublicRoomList} from "../../../firebase/firebase_connect.js";

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
        const result = fb.getRoomList();
        return res.status(200).json(result);
    }
    else if (req.method === "PUT") {
        const result = fb.getRoomList();
        return res.status(200).json(result);
    }
    else if (req.method === "DELETE") {
        const result = fb.delRoom();
        return res.status(200).json(result);
    }

}