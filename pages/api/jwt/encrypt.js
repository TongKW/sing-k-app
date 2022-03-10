import verify_token from "../../../utils/jwt/verify";
import getConfig from "next/config";
import sign_token from "../../../utils/jwt/sign";

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
      let token = sign_token(newPayload, secret_key, 30);
      res.setHeader(
        "Set-Cookie",
        `isLogin=${true}; username=${username}; path=/;`
      );
      return res.status(200).json({
        success: true,
        token: token,
      });
    }
  }
}
