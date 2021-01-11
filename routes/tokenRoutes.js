const express = require("express");
const app = express();
const cors = require("cors");
const tokenRoutes = express.Router();
const bcrypt = require("bcryptjs");
const async = require("async");
const jwt = require("jsonwebtoken");
const moment = require("moment");
let User = require("../models/User");
require('dotenv').config();
const JWTKey = process.env.JWTKey
tokenRoutes.use(cors());


tokenRoutes.route("/Login").post(function(req, res) {
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
            let token = jwt.sign(payload, JWTKey, {
              expiresIn: 1440
            });
            let date = new Date();
            res.json({token: token, expiresIn: moment(date).add(1440, 'seconds').format("YYYY-MM-DD HH:mm:ss")});
          } else {
            // Passwords don't match
            res.json({ error: "Password Mismatch" });
          }
        });
      } else {
        res.json({ error: "User credentials incorrect" });
      }
    })
    .catch(err => {
      res.send("error: " + err);
    });
});
module.exports = tokenRoutes;
