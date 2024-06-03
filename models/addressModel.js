const mongoose = require("mongoose");
const addressSchema = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    name:{
        type:String
    },
    phone:{
        type:Number
    },
    address:{
        type:String
    },
    city:{
        type:String
    },
    state:{
        type:String
    },
    district:{
        type:String
    },
    pincode:{
        type:Number
    },
    country:{
        type:String
    },
    default:{
        type:Boolean,
        default:false
    }

})

const Address = mongoose.model("Address",addressSchema);
module.exports = Address;