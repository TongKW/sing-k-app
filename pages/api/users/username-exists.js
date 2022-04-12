import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_SERVER;

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { username } = req.body;
    return await checkUsernameExists(username, res);
  }
}

async function checkUsernameExists(username, res) {
  let isExists = false;

  const client = new MongoClient(uri);
  await client.connect();
  const user_info = client.db("users").collection("user_info");

  const query = { username: username };
  const result = user_info.find(query);

  await result.forEach((result) => {
    isExists = true;
    user = result;
    //console.log(user);
  });
  await client.close();
  if (!isExists) {
    //console.log("No username conflict");
    return res.status(200).json({
      exists: false,
      message: "No username conflict",
    });
  }
  //console.log("Username already exists!");
  return res.status(200).json({
    exists: true,
    message: "Username already exists!",
  });
}
