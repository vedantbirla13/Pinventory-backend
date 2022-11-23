const User = require("../models/userModel.js")
const asyncHandler = require("express-async-handler")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const Token = require("../models/tokenModel.js") 
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail.js")


// Generating a unique token using JWT
const generateToken = (id) => {
    return jwt.sign({id} , process.env.JWT_SECRET, {expiresIn: "1d"})
}

// Register user
const registerUser = asyncHandler(async(req,res) => {

    const { name, email, password } = req.body;

    // Validation
    if(!name || !email || !password){
        res.status(400);
        throw new Error("Please fill in all required fields");
    }

    if(password.length < 6){
        res.status(400);
        throw new Error("Password must be up to 6 characters");
    }

    // Check if user email already exists
    const userExist = await User.findOne({email});

    if(userExist){
        res.status(404);
        throw new Error("Email has already been registered");    
    }



    // Create new user
    const user  = await User.create({
        name,
        email,
        password,
    });

    
    // Generate token
    const token = generateToken(user._id);

    // Send Http-only cookie
    res.cookie("token" , token, {   // Syntax - ("name of cookie" , created token, {options})
        path: "/",
        httpOnly: true, // Only to be used by the web browser
        expires: new Date(Date.now() + 1000 * 84600), // 1 day
        sameSite: "none",
        secure: true
    });


    if(user){
        const { _id, name, email, photo, phone, bio } = user;
        res.status(201).json({
            _id, name, email, photo, phone, bio, token
        })
    } else {
        res.status(400);

        throw new Error("Invalid user data");
    }
});

// Login user

const loginUser = asyncHandler(async(req,res) => {
    const { email, password } = req.body;

    // Validations
    if (!email || !password){
        res.status(400);
        throw new Error("Please enter email and password");
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user){
        res.status(400);
        throw new Error("User not found, please signup");
    }

    // User exists, check if password is correct
    const validPassword = await bcrypt.compare(password, user.password);

    // Generate token
    const token = generateToken(user._id);

    // Send Http-only cookie
    res.cookie("token" , token, {   // Syntax - ("name of cookie" , created token, {options})
        path: "/",
        httpOnly: true, // Only to be used by the web browser
        expires: new Date(Date.now() + 1000 * 84600), // 1 day
        sameSite: "none",
        secure: true
    });


    // If valid then send the data
    if(user && validPassword){
        const { _id, name, email, photo, phone, bio } = user;
        res.status(200).json({
            _id, name, email, photo, phone, bio, token
        })
    }else {
        res.status(400);
        throw new Error("Invalid email or password");
    }
});

// Logout user
const logout = asyncHandler(async (req,res) => {
    res.cookie("token" , "", {  
        path: "/",
        httpOnly: true, 
        expires: new Date(0),  //Exprire immediately
        sameSite: "none",
        secure: true
    });

    res.status(200).json({
        message: "Logged out successfully"
    })
})

// Get user data
const getUser = asyncHandler(async (req,res) => {

    const user = await User.findById(req.user._id);
    if(user){
        const { _id, name, email, photo, phone, bio } = user;
        res.status(200).json({
            _id, name, email, photo, phone, bio
        })
    }else {
        res.status(400);
        throw new Error("User not found");
    }
})

// Login status
const loginStatus = asyncHandler(async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
      return res.json(false);
    }
    // Verify Token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified) {
      return res.json(true);
    }
    return res.json(false);
  });

//  Update User
const updateUser = asyncHandler(async (req,res) => {

    // Get the user by id
    const user = await User.findById(req.user._id);
    if(user){
        const { name, email, photo, phone, bio } = user;
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;
        user.photo = req.body.photo || photo;

        // save the updated user
        const updatedUser = await user.save();
        // update all the fields with the updated values
        res.status(200).json({
            _id: updatedUser._id, 
            name: updatedUser.name, 
            email: updatedUser.email, 
            photo: updatedUser.photo, 
            phone: updatedUser.phone, 
            bio: updatedUser.bio
        })
    } else {
        res.json(404);
        throw new Error("User not found!!");
    }
});

// Change password
const changePassword = asyncHandler(async (req,res) => {
    const user = await User.findById(req.user._id);
    if(!user){
        res.status(400)
        throw new Error("User not found, Please sign in")
    }
    const { oldPassword, password } = req.body;

    // Validate
    if(!oldPassword || !password){
        res.status(400)
        throw new Error("Please enter old and new Password")
    }

    // Check if old password matches the password in DB
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    // save new password
    if(user && passwordIsCorrect){
        user.password = password
        await user.save();
        res.status(200).send("Password changed succesfully")
    }else{
        res.status(400)
        throw new Error("Old password is incorrect")
    }

});

// Forgot password
const forgotPassword = asyncHandler(async (req,res) => {

    const { email } = req.body;
    const user = await User.findOne({ email });

    if(!user){
        res.status(404)
        throw new Error("User does not exist");
    }

    // Delete the token if it already exists in the DB
    let token = await Token.findOne({ userId: user._id });
    if(token){
        await token.deleteOne();
    }

    // Create reset token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    console.log(resetToken);

    // Hash token before saving to DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // save token to DB
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000) // 30 mins 
    }).save() 

    // Construct Reset Url
     const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    //  Reset email
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the url below to reset your password</p>
        <p>This reset link is valid for only 30 minutes</p>

        <a href=${resetUrl} clicktracking=off >${resetUrl}</a>

        <p>Regards...</p>
        <p>Pinventory Team</p>
    `

    const subject = "Password reset request"
    const send_to = user.email
    const send_from = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, send_to, send_from)
        res.status(200).json({
            success: true,
            message: "Reset email sent"
        })
    } catch (error) {
        res.status(400)
        throw new Error("Email not sent, Please try again")
    }
})

// Reset password 
const resetPassword = asyncHandler(async (req,res) => {
    
    // Get the id from the url
    const { password } = req.body;
    const { resetToken } = req.params;

    // Hash token, then compare it with token in the DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Find token in DB
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()} //Check if the token has expired or not , gt = greater than 
    })

    if(!userToken) {
        res.status(400)
        throw new Error("Invalid or expired token");
    }

    // Find user
    const user = await User.findOne({ _id: userToken.userId })
    user.password = password
    await user.save()

    res.status(200).json({
        message: "Password reset successfully, Please login"
    })

})

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
  };