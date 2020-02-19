const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const PORT = 4000;
const cors = require("cors");
const logger = require("morgan");
const mongoose = require("mongoose");
const config = require("./config/DB");
const userRoutes = require("./routes/userRoutes");
const flash = require("connect-flash");
const session = require("express-session");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
//const swaggerDocument = require("./swagger.json");

const swaggerDefinition = {
  info: {
    title: "My Node Swagger API",
    version: "1.0.0",
    description: "Endpoints to test"
  },
  host: "localhost:4000",
  basePath: "/",
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      scheme: "bearer",
      in: "header"
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ["./routes/userRoutes.js"],
  explorer: true
};

const swaggerSpec = swaggerJSDoc(options);

app.get("/swagger.json", function(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// const mongoURI = "mongodb://localhost:27017/nodeapi";

mongoose
  .connect(config.DB, { useNewUrlParser: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(logger("dev"));
app.use(flash());

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

app.use("/user", userRoutes);

app.listen(PORT, function() {
  console.log("Server is running on Port:", PORT);
});
