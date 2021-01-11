const express = require("express");
const app = express();
const cors = require("cors");
const homeRoutes = express.Router();
homeRoutes.use(cors());
homeRoutes.get("/", (req, res, next) => {
    res.json({ info: "API is running" });
});
module.exports = homeRoutes;