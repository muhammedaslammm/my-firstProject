const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({    
    couponCode:{
        type:String
    },
    minimumAmount:{
        type:Number
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date,
        index:{expires:'0s'}
    }
    
})


const couponModel = mongoose.model('Coupon',couponSchema);
module.exports = couponModel;



