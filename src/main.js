const express = require("express");
const environment = require("./common/environment");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const dbSync = require('./libs/dbsync')
const Scheduler = require("./libs/scheduler");

const app = express();
const port = environment.port;

(async() => await dbSync(false))();

app.set("view engine", "ejs");
app.set("views", "src/views");
app.use("/public", express.static(path.join(__dirname, "../public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(routes);

Scheduler();

app.listen(port, async() => console.log(`Server is running on port ${port}`));