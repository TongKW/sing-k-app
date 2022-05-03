import {MongoClient} from 'mongodb';


const uri = process.env.MONGODB_SERVER;

export default async function handler(req, res) {
    if (req.method === "GET") {
        /*
        This function is handling http GET request to path /api/user/all, to
        return a list of user json
         */
        const client = new MongoClient(uri);
        await client.connect();
        var user_info = client.db("users").collection('user_info');

        var result = [];
        await user_info.find("").forEach(user => {
            result.push(user);
        });

        return res.status(200).json(result);
    }

}