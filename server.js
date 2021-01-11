const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const PORT = 7000;
const cors = require("cors");
const logger = require("morgan");
var morgan = require('morgan');
const mongoose = require("mongoose");
const config = require("./config/DB");
const userRoutes = require("./routes/userRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const homeRoutes = require("./routes/homeRoutes");

const flash = require("connect-flash");
const session = require("express-session");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express"), swaggerDocument = require("./swagger.json");
const successLogger = require('./utils/logger').successLogger;
const errorLogger = require('./utils/logger').errorLogger;


app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
mongoose
  .connect(config.DB, { useNewUrlParser: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('combined', { stream: successLogger.stream }));
app.use(morgan('combined', { stream: errorLogger.stream }));


//app.use(logger("dev"));
app.use(flash());

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

app.use("/user", userRoutes);
app.use("/", homeRoutes);
app.use("/auth", tokenRoutes);

app.listen(PORT, function() {
  successLogger.info(`Server is running on Port: ${PORT}`); 
  console.log(`Console Server is running on Port: ${PORT}`);
});
