const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{
        type:String
    },
    email:{
        type:String
    },
    number:{
        type:Number,
    },
    password:{
        type:String
    },  
    referral_code:{
        type:String,
    },
    isBlocked:{
        type:Boolean,
        default:false
    }

})

const User = mongoose.model("User",userSchema);

module.exports = User;