const express = require("express")
const { changePassword, forgotPassword, getUser, loginStatus, loginUser, logout, registerUser, resetPassword, updateUser } = require("../controllers/user");
const protect = require("../middlewares/authMiddleware")

const router = express.Router();

// Register user
router.post("/register", registerUser);

// Login User
router.post("/login", loginUser);

// Logout User
router.get("/logout" , logout);

// Get User details
router.get("/getuser" , protect,  getUser);

// Get login status
router.get("/loggedin", loginStatus);

// Update user
router.patch("/updateuser",protect, updateUser);

// Update password
router.patch("/changepassword",protect, changePassword);

// Forgot password
router.post("/forgotpassword" , forgotPassword);

// create reset password route
router.put("/resetpassword/:resetToken" , resetPassword);


module.exports =  router;