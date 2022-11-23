const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const bodyParser = require("body-parser")
const errorHandler = require("./middlewares/ErrorMiddleware")
const path = require("path")
const cookieParser = require("cookie-parser")

    

const app = express();
module.exports = app;

dotenv.config({
    path: "./config/config.env"
})


// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true
}));


// Importing routes
const userRoute = require("./routes/userRoute")
const productRoute = require("./routes/productRoute")
const contactRoute = require("./routes/contactRoute")

app.use("/api/v1/users" , userRoute);
app.use("/api/v1/products" , productRoute);
app.use("/api/v1/contactus" , contactRoute);


// Using error middleware
app.use(errorHandler);
