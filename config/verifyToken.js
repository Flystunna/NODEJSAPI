var jwt = require("jsonwebtoken");
process.env.SECRET_KEY = "secret";

function verifyToken(req, res, next) {
  var token = req.headers["authorization"];
  if (!token)
    return res.status(403).send({ auth: false, message: "No token provided." });
  jwt.verify(token, process.env.SECRET_KEY, function(err, decoded) {
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