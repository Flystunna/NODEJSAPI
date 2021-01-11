var jwt = require("jsonwebtoken");
require('dotenv').config();
const JWTKey = process.env.JWTKey

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader)
    return res.status(401).send({ auth: false, message: "Unauthorized." });
  let token = authHeader.split(' ')[1];
  jwt.verify(token, JWTKey, function (err, decoded) {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });
    }
    // if everything good, save to request for use in other routes
    req.userId = decoded._id;
    next();
  });
}

module.exports = verifyToken;
