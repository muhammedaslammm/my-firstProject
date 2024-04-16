const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const emailID = "muhammedbinramli@gmail.com";
const password = 'eprd wgdv glrc crvm'

exports.generateOtp = function(){
    return otpGenerator.generate(4,{didgits:true,lowerCaseAlphabets:false,upperCaseAlphabets:false,specialChars:false});
}

exports.sendMessage = async function(otp,email){
    const transporter = nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:emailID,
            pass:password
        }
    })
    const mailOption = {
        from:emailID,
        to:email,
        subject:"OTP verification",
        text:`Ypur One Time Password is ${otp}`
    }
    
    try{
        await transporter.sendMail(mailOption)
        console.log("email successfully sended");
    }
    catch(error){
        console.log("mail failed to send",error);
    }
}


