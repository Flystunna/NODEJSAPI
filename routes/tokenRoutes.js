const express = require("express");
const app = express();
const cors = require("cors");
const tokenRoutes = express.Router();
const bcrypt = require("bcryptjs");
const async = require("async");
const jwt = require("jsonwebtoken");
const verifyToken = require("../config/verifyToken");

let User = require("../models/User");
tokenRoutes.use(cors());

process.env.SECRET_KEY = "secret";

tokenRoutes.route("/GetToken").post(function(req, res) {
  User.findOne({
    email: req.body.email
  })
    .then(user => {
      if (user) {
        bcrypt.compare(req.body.password, user.password, function(err, result) {
          console.log(result);
          if (result) {
            // Passwords match
            const payload = {
              _id: user._id,
              fullname: user.fullname,
              username: user.username,
              email: user.email
            };
            let token = jwt.sign(payload, process.env.SECRET_KEY, {
              expiresIn: 1440
            });
            res.send(token);
          } else {
            // Passwords don't match
            res.json({ error: "Password Mismatch" });
          }
        });
      } else {
        res.json({ error: "User does not exist" });
      }
    })
    .catch(err => {
      res.send("error: " + err);
    });
});
module.exports = tokenRoutes;
