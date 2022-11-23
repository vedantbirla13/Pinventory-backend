const asyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const sendEmail = require("../utils/sendEmail")



const contactUs = asyncHandler(async(req,res) => {
    
    const { subject, message } = req.body

    // Validations
    if(!subject || !message){
        res.status(400)
        throw new Error("Please add subject and message") 
    }

    const user = await User.findById(req.user._id)
    if(!user){
        res.status(404)
        throw new Error("User not found, Please sign up")
    }

    const send_to = user.email
    const send_from = user.email
    const reply_to = process.env.EMAIL_USER
    try {
        await sendEmail(subject, message, send_to, send_from, reply_to)
        res.status(200).json({
            success: true,
            message: "Email sent"
        })
    } catch (error) {
        res.status(400)
        throw new Error("Email not sent, Please try again")
    }


})

module.exports = contactUs