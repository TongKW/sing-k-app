import verify_token from "../../../utils/jwt/verify";
import getConfig from 'next/config'

const { serverRuntimeConfig } = getConfig();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { token } = req.body;
    const secret_key = serverRuntimeConfig.jwt_secret;
    const result = verify_token(token, secret_key)
    console.log(result);

    return res.status(200).json(result);
  }
}