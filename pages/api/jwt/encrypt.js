import verify_token from "../../../utils/jwt/verify";
import getConfig from "next/config";
import { signNewToken } from "../users/auth";

const { serverRuntimeConfig } = getConfig();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { token, id, username, email, avatar } = req.body;
    const newPayload = {
      id: id,
      username: username,
      email: email,
      avatar: avatar,
    };
    const secret_key = serverRuntimeConfig.jwt_secret;
    const result = verify_token(token, secret_key);
    console.log(result);

    if (!result.authorized) {
      return res.status(200).json({ success: false, token: null });
    } else {
      return await signNewToken(newPayload, secret_key, res);
    }
  }
}
