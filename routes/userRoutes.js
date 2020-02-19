const express = require("express");
const app = express();
const cors = require("cors");
const userRoutes = express.Router();
const bcrypt = require("bcryptjs");
const async = require("async");
const jwt = require("jsonwebtoken");
const verifyToken = require("../config/verifyToken");

let User = require("../models/User");
userRoutes.use(cors());

process.env.SECRET_KEY = "secret";

userRoutes.route("/signup").post(function(req, res) {
  let { fullname, username, password, phone, email, address } = req.body;
  let errors = [];
  if (!fullname || !username || !password || !phone || !email || !address) {
    res.json({ error: "All boxes are required" });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        res.json({ error: "Email already exist" });
        console.log("Email is already registered");
      } else {
        let user = new User(req.body);

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;
            user
              .save()
              .then(user => {
                res.json({
                  user
                });
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

userRoutes.route("/login").post(function(req, res) {
  User.findOne({
    email: req.body.email
  })
    .then(user => {
      if (user) {
        console.log(user);
        if (bcrypt.compare(req.body.password, user.password)) {
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
      } else {
        res.json({ error: "User does not exist" });
      }
    })
    .catch(err => {
      res.send("error: " + err);
    });
});

userRoutes.route("/getprofile").get(function(req, res) {
  var decoded = jwt.verify(
    req.headers["authorization"],
    process.env.SECRET_KEY
  );

  User.findOne({
    _id: decoded._id
  })
    .then(user => {
      if (user) {
        res.json(user);
      } else {
        res.send("User does not exist");
      }
    })
    .catch(err => {
      res.send("error: " + err);
    });
});

userRoutes.route("/me").get(verifyToken, function(req, res, next) {
  User.findById(req.userId, { password: 0 }, function(err, user) {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");

    res.status(200).send(user);
  });
});

userRoutes.route("/getAllUsers ").get(verifyToken, (req, res, next) => {
  User.find(function(err, users) {
    if (err) {
      next(err);
    } else {
      res.json(users);
    }
  });
});
var getOneUser = function (req, res) {
  res.json(req.user);
};
userRoutes.route('/:userId').get(getOneUser);

// add the middleware function
userRoutes.use(function(user, req, res, next) {
  res.status(200).send(user);
});
module.exports = userRoutes;
