var User = require("../models/User");
const db = require("../config/db");

module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.send("Please log in to view this page");
  },
  checkUser: function(req, res, next) {
    User.find().toArray(function(err, result) {
      if (err) throw err;
    });
    if (req.isAuthenticated()) {
      User.find(function(err, user) {
        if (req.user.isAdmin === true) {
          next();
        } else {
          res.send("Contact an Administrator");
        }
      });
    } else {
      res.send("You need to be signed in!");
    }
  }
};
