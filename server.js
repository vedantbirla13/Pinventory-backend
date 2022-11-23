const app = require("./app")
const connectDB = require("./config/database")


// Routes
app.get("/" , (req,res) => {
    res.send("Working");
})


connectDB(); //Connect to database
app.listen(process.env.PORT , () => {
    console.log(`Server started on port ${process.env.PORT}`);
})
