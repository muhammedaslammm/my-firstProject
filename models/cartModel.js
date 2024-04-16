const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId
    },
    productID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product'
    },
    quantity:{
        type:Number
    },
    size:{
        type:String
    }
    
})

const cart = mongoose.model("cart",cartSchema);
module.exports = cart;