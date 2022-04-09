module.exports = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    jwt_secret: process.env.JWT_TOKEN,
  },
}