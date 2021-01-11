const express = require("express");
const app = express();
const cors = require("cors");
const userRoutes = express.Router();
const bcrypt = require("bcryptjs");
const async = require("async");
const jwt = require("jsonwebtoken");
const verifyToken = require("../config/verifyToken");
const sgMail = require("@sendgrid/mail");
const successLogger = require('../utils/logger').successLogger;
const errorLogger = require('../utils/logger').errorLogger;
require("dotenv").config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

let User = require("../models/User");
userRoutes.use(cors());

const JWTKey = process.env.JWTKey

userRoutes.route("/signup").post(function (req, res) {
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
        user
          .save()
          .then(user => {
            successLogger.info(`User sign up sucessful ${user.email} ${req.originalUrl} - ${req.method} - ${req.ip}`);
            res.json({ user });
          })
          .catch(err => {
            errorLogger.error(err)
            console.log(err)
          });
      }
    });
  }
});

userRoutes.route("/getprofile").get(verifyToken, function (req, res) {
  const authHeader = req.headers.authorization;
  let token = authHeader.split(' ')[1];
  var decoded = jwt.verify(token, JWTKey);
  let UserId = '';
  findIdByToken(token, function (result) {
    UserId = result._id;
  });
  User.findOne({
    _id: UserId
  }).then(user => {
      if (user) {
        res.json(user);
      } else {
        res.send("User does not exist");
      }
    })
    .catch(err => {
      errorLogger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
      res.send("error: " + err);
    });
});

userRoutes.route("/me").get(verifyToken, function (req, res, next) {
  User.findById(req.userId, { password: 0 }, function (err, user) {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    res.status(200).send(user);
  });
});

userRoutes.route("/getAllUsers ").get(verifyToken, (req, res, next) => {
  User.find(function (err, users) {
    if (err) {
      next(err);
    } else {
      res.json(users);
    }
  });
});

//change password

userRoutes
  .route("/changePassword")
  .post(verifyToken, async (req, res, next) => {
    console.log(req.body);
    let oldPwd = req.body.oldpassword;
    let newPwd = req.body.newpassword;
    if (!oldPwd && !newPwd) {
      res.statusCode = 400;
      res.data = {
        status: false,
        error: "Invalid Parameters"
      };
    }
    User.findOne({
      _id: req.userId
    })
      .then(user => {
        if (!user) {
          res.json({ error: "User does not exist" });
        } else {
          //compare password not working
          bcrypt.compare(oldPwd, user.password, function (err, result) {
            console.log(result);
            if (result != true) {
              res.statusCode = 400;
              res.send("Old Password doesn't match");
            } else {
              user.password = newPwd;
              user
                .save()
                .then(user => {
                  res.json({ user });
                })
                .catch(err => console.log(err));
              res.send("Password updated successfully");
              next();
            }
          });
        }
      })
      .catch(err => {
        res.send("error: " + err);
      });
  });
userRoutes.get("/reset/otp", (req, res, next) => {
  let email = req.body.email;
  let otp = req.body.otp;
  let password = req.body.password;
  if (!email || !otp || !password) {
    res.statusCode = 400;
    res.data = {
      status: false,
      error: "Invalid Parameters"
    };
  }
  User.findOne({ email: email }).then(user => {
    if (!user) {
      res.json({ error: "Email does not exist" });
    }
    if (user.otp != otp) {
      res.json({ error: "Invalid OTP" });
    }
    user.otp = null;
    user.password = password;
    user.save();
    async.waterfall(
      [
        function (user, done) {
          var msg = {
            to: user.email,
            from: "flystunna1@gmail.com",
            subject: "Your password has been changed",
            text:
              "Hello,\n\n" +
              "This is a confirmation that the password for your account " +
              user.email +
              " has just been changed.\n"
          };
          sgMail.send(msg, err => {
            res.json("Success! Your password has been changed.");
            done(err, "done");
          });
        }
      ],
      err => {
        if (err) return next(err);
        res.json(err);
      }
    );
  });
});

userRoutes.post("/reset", (req, res, next) => {
  let email = req.body.email;
  if (!email) {
    res.statusCode = 400;
    res.data = {
      status: false,
      error: "Invalid Parameters"
    };
  }
  User.findOne({ email: email }).then(user => {
    if (!user) {
      res.json({ error: "Email does not exist" });
    }
    //randomly generate 6 digits pins and send email
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.save();
    async.waterfall(
      [
        function (user, done) {
          var msg = {
            to: email,
            from: "flystunna1@gmail.com",
            subject: "Password Reset OTP",
            text:
              "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
              "Your Password Reset OTP is: " +
              otp +
              " \n\n" +
              "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
              "http://" +
              req.headers.host +
              "/user/reset/otp" +
              "\n\n" +
              "If you did not request this, please ignore this email and your password will remain unchanged.\n"
          };
          sgMail.send(msg, err => {
            res.json(
              "An e-mail has been sent to " +
              req.body.email +
              " with further instructions."
            );
            if (err) res.json(err);
            done(err, "done");
          });
        }
      ],
      err => {
        if (err) return next(err);
        res.json(err);
      }
    );
  });
});


function findIdByToken(token, fn){
  jwt.verify(token, JWTKey, function (err, decoded) {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });
    }
    fn(decoded);
  });
}

// var getOneUser = function (req, res) {
//   res.json(req.user);
// };
// userRoutes.route('/:userId').get(getOneUser);

// add the middleware function
userRoutes.use(function (user, req, res, next) {
  res.status(200).send(user);
});
module.exports = userRoutes;

// userRoutes.route("/login").post(function(req, res) {
//   User.findOne({
//     email: req.body.email
//   })
//     .then(user => {
//       if (!user) {
//         res.json({ error: "User does not exist" });
//       }
//       const password = req.body.password;
//       bcrypt.compare(password, user.password, (err, isMatch) => {
//         if (err) throw err;
//         console.log(isMatch);
//         if (isMatch) {
//           // Passwords match
//           const payload = {
//             _id: user._id,
//             fullname: user.fullname,
//             username: user.username,
//             email: user.email
//           };
//           let token = jwt.sign(payload, process.env.SECRET_KEY, {
//             expiresIn: 1440
//           });
//           res.send(token);
//         } else {
//           // Passwords don't match
//           res.json({ error: "Password Mismatch" });
//         }
//       });
//     })
//     .catch(err => {
//       res.send("error: " + err);
//     });
// });
