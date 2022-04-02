import {MongoClient} from 'mongodb';

const uri = "mongodb://admin:admin@alexauwork.com:30000/";

export default async function handler(req, res) {
    if (req.method === "GET") {
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