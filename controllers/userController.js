const User = require("./../models/userModel");
const Product = require("./../models/productModel");
const Address = require("./../models/addressModel");
const Banner = require("./../models/bannerModel");
const Wallet = require("./../models/walletModel");
const referralCode = require("./../operations/generateReferralID");

const validator = require("validator");
const bcrypt = require("bcrypt");
const {generateOtp,sendMessage} = require("../operations/otp")

// user signup page
exports.signupPage = function(req,res){
    if(req.session.userID){
        res.redirect("/");
    }
    else{
        res.render("signupPage")
    }    
}

// signup page submission
exports.signupPage_post = async function(req,res){
    
    req.session.userData = req.body;
    req.session.otp = generateOtp();        
    console.log(req.session.otp);
    sendMessage(req.session.otp,req.body.email);
    res.redirect("/signup-otp");
            
}

// OTP page after signup
exports.signupOtpPage = function(req,res){
    if(req.session.otp){
        const email = req.session.userData.email
        res.render("otpPage",{
            email
        })
    }
    else{
        res.redirect("/signup");
    }   
}
// resend OTP
exports.resendOTP = async function(req,res){
    const email = req.body.email;
    try{
        req.session.otp = generateOtp();
        const otp = req.session.otp
        await req.session.save();
        await sendMessage(otp,email);
        console.log(otp);
        res.json({success:'otp sended',otp})
    }
    catch(error){
        res.render({error:'failed to send otp'})
    }
}

// delete otp
exports.deleteOtp = async function(req,res){
    try{
        delete req.session.otp;
        await req.session.save()
        res.json({success:"Otp deletion Successfull"})
    }
    catch(error){
        res.json({error:"Otp deletion failed"})
    } 
}

// OTP submission for signing up
exports.signupOtpSubmission = async function(req,res){
    const userPassword = req.session.userData.password;
    const email = req.session.userData.email
    if(req.session.otp === req.body.otp){
        // creating hashed password
        try{
            const hashedPassword = await bcrypt.hash(userPassword,10);
            console.log("hashed password created");

            // then, creating user   
            const referral_code = referralCode()         
            await User.create({
                username:req.session.userData.username,
                email:req.session.userData.email,
                password:hashedPassword,
                referral_code
            })
            console.log("user created");        
            
            
            // then getting user ID for uathentication            
            const signedUser = await User.findOne({email});
            req.session.userID = signedUser._id;
            res.json({message:"user account created"})            
        }
        catch(error){
            console.log("server error",error);
            res.json({error:'server error'})
        }        
    }
    else{
        res.json({error:'Invalid OTP'})
    }
}


// user login page
exports.loginPage = function(req,res){
    if(req.session.userID){
        res.redirect("/home")
    }
    else{
        res.render("loginPage")
    }
}


// user login post
exports.loginPage_post = async function(req,res){
    const errors = {}
    const {email,password} = req.body;
    for(let key in req.body){
        if(validator.isEmpty(req.body[key])){
            errors[key] = "invalid input"
        }
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if(!emailRegex.test(email)){
        errors.email = "Enter Valid Email"
    }

    if(Object.keys(errors).length>0){
        res.render("loginPage",{errors,userData:req.body})
    }
    try{        
        const matchingData = await User.findOne({email});
        if(matchingData){
            const matchingUser = await bcrypt.compare(password,matchingData.password);
            if(matchingUser){
                req.session.userID = matchingData._id;
                res.redirect("/")
            }
            else{
                errors.login = "Invalid Email or Password";
                res.render("loginPage",{errors,userData:req.body})
            }

        }
        else{
            errors.login = "Invalid Email or Password";
            res.render("loginPage",{errors,userData:req.body})
        }    
    }
    catch(error){
        console.log("server errors. user logging in failed",error);
    }
    
}
exports.homepage = async function(req,res){
    try{
        const bannerTitles = ["T_Shirts","Shirts","Oversized","Hoodies","Formal_wear","Formals","Wedding_Wear","Home"];
        const banners = {};


        for(let title of bannerTitles){
            banners[title.toLowerCase()] = await Banner.findOne({deletedAt:null,title})
        }
        res.render("homepage",{
            userID:req.session.userID,
            banners
        })
    }
    catch(error){
        console.log(error,"error when rendering home page");
    }
}


// user logging out
exports.logout = function(req,res){
    req.session.destroy(function(error){
        if(error){
            console.log("session destruction failed");
            res.redirect("/home")
        }
        else{
            console.log("session destroyed");
            res.redirect("/")
        }
    })
}

// user profile page
exports.userprofilePage = async function(req,res){
    const userID = req.session.userID;
    try{
        const userData = await User.findById(userID);
        const defaultAddress = await Address.findOne({$and:[{userID},{default:true}]})
        
        res.render("userProfile",{user:userData,address:defaultAddress,userID})

    }catch(error){
        console.log("some error occured",error);
    }    
}

// edit user page
exports.edit_user = async function(req,res){
    const edit = req.query.edit;
    
    res.render("edit_user",{edit,userID:req.session.userID});
}

// edit user-name, email and number
exports.edit_user_post = async function(req,res){
    const edit = req.query.edit;
    const userID = req.session.userID
    if(edit === "username"){
        try{
            await User.updateOne({_id:userID},{$set:{username:req.body.username}})
            console.log("username successfully updated");
            res.redirect("/user-profile")
        }
        catch(error){
            console.log("username updation failed");
            res.redirect("/user-profile",error)
        }
        
    }
    else if(edit === 'email'){
        try{
            await User.updateOne({_id:userID},{email:req.body.email});
            console.log("user email updated");
            res.redirect("/user-profile")
        }
        catch(error){
            console.log("user email updation failed");
            res.redirect("/user-profile")
        }
    }
    else if(edit === "number"){
        try{
            const number = Number(req.body.number)
            await User.updateOne({_id:userID},{number:number});
            console.log("user phone number updated");
            res.redirect("/user-profile")
        }
        catch(error){
            console.log("user phone number updation failed");
            res.redirect("/user-profile")
        }
    }
}

// rest password page
exports.resetPasswordPage = function(req,res){
    res.render("resetPassword",{userID:req.session.userID})
}
// reset password
exports.resetPassword = async function(req,res){
    const {password,newPassword,re_newPassword} = req.body;
    const userID = req.session.userID;
    const error = {};
    for(let key in req.body){
        if(validator.isEmpty(req.body[key])){
            error[key] = "invalid input"
        }
    }
    console.log(error);
    if(Object.keys(error).length > 0){
        res.render("resetPassword",{error,data:req.body,userID})
    }
    else{         
        try{                   
            const userData = await User.findById(userID);
            if(userData.password != password){
                error.password = "Incorrect Password";
                res.render("resetPassword",{error,data:req.body,userID})
            }
            else if(newPassword != re_newPassword){
                error.re_newPassword = "invalid match";
                res.render("resetPassword",{error,data:req.body,userID})
            }
            else{
                try{
                    const hashedPassword = bcrypt.hash(password,10);
                    await User.updateOne({_id:userID},{$set:{password:hashedPassword}})
                    console.log("password updated");
                    res.redirect("/user-profile")
                }
                catch(error){
                    console.log("server error",error);
                }
            }
        }
        catch(error){
            console.log("server error",error);
            res.redirect("/user-profile/reset-password")
        }
    }      
    
}

// address page
exports.addressPage = async function(req,res){
    const userID = req.session.userID;
    try{
        const addresses = await Address.find({userID});        
        res.render("addressPage",{addresses,userID});
    }
    catch(error){
        console.log("some error occured",error);
    }
}
// new address form
exports.newAddress = async function(req,res){
    res.render("newAddress",{userID:req.session.userID})
}

// create new address
exports.addNewAddress = async function(req,res){
    const userID = req.session.userID;
    const error = {}
    for(let key in req.body){        
        if(validator.isEmpty(req.body[key])){
            error[key] = "field required"
        }
    }    
    if(req.body.phone.length >10 || req.body.phone.length <10){
        error.phone = "invalid phone number"
    }
    if(req.body.pincode.length >6 || req.body.pincode.length <6){
        error.pincode = "invalid pincode"
    }
    if(Object.keys(error).length > 0){
        res.render("newAddress",{error,data:req.body})
    }
    else{
        for(let key in req.body){
            const words = req.body[key].split(" ");
            const sentence = words.map(function(word){
                return word[0].toUpperCase() + word.slice(1);
            }).join(" ");
            req.body[key] = sentence;
        }
        try{
            const addressData = await Address.create({
                userID,
                name:req.body.name,
                address:req.body.address,
                phone:req.body.phone,
                city:req.body.city,
                state:req.body.state,
                district:req.body.district,
                pincode:req.body.pincode,
                country:req.body.country
            })
            console.log("address successfully added");
            
            const addressId = addressData._id;
            if(req.body.check_box_status === "Checked"){
               const updateAlladdresses = await Address.updateMany({userID},{default:false})
               const updatedAddress = await Address.findByIdAndUpdate(addressId,{default:true});
            }
            res.redirect("/address-management")
        }
        catch(error){
            console.log("error occured",error);
            res.redirect("/address-management")
        }
    }
}

// remove address
exports.removeAddress = async function(req,res){
    const userID = req.session.userID;
    const addressID = req.params.id;
    try{
        await Address.findByIdAndDelete(addressID);
        console.log("Address Successfully Deleted");
        res.redirect("/address-management")
    }
    catch(error){
        console.log("some error occured",error);
        res.redirect("/address-management")
    }
}

// edit address page
exports.editAddressPage = async function(req,res){
    try{
        const addressData = await Address.findById(req.params.id);
        res.render("editAddress",{data:addressData});
    }
    catch(error){
        console.log("error occured",error);
        res.redirect("/address-management");
    }
    
}
// edit address
exports.editAddress = async function(req,res){
    try{
        req.body._id = req.params.id;
        const error = {};
        for(let key in req.body){
            if(validator.isEmpty(req.body[key])){
                error[key] = "field required"
            }
        }
        if(req.body.phone.length > 10 || req.body.phone.length < 10 ){
            error.phone = "invalid phone number"
        }
        if(req.body.pincode.length > 6 || req.body.pincode.length < 6){
            error.pincode = "invalid pincode"
        }
        if(Object.keys(error).length > 0 ){
            res.render("editAddress",{error,data:req.body})
        }
        else{
            await Address.findByIdAndUpdate(req.params.id,req.body);
            console.log("address updated successful");
            res.redirect("/address-management")            
        }
    }
    catch(error){
        console.log("error occured",error);
    }
    
}


// set default address
exports.setDefaultAddress = async function(req,res){
    try{
        const addressID = req.params.id;       
        const userID = req.session.userID;
        console.log(addressID);
        await Address.updateMany({userID},{$set:{default:false}})
        await Address.findByIdAndUpdate(addressID,{default:true});
        res.redirect("/address-management")
    }
    catch(error){
        console.log("error occured",error);
        res.redirect("/address-management")
    }

}

// wallet page
exports.walletPage = async function(req,res){
    const userID = req.session.userID;
    try{        
        const wallet  = await Wallet.find({userID});
        console.log(wallet);
        res.render("wallet",{userID,wallet})
    }
    catch(error){
        console.log("error when rendering wallet page",error);
    }
}