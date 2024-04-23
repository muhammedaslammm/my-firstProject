const mongoose = require("mongoose");
const usedCouponSchema = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId
    },
    couponID:{
        type:mongoose.Schema.Types.ObjectId
    },
    usedDate:{
        type:Date
    },
    couponUsed:{
        type:Boolean,
        default:false
    }
})

const usedCouponModel = mongoose.model('UsedCoupon',usedCouponSchema);
module.exports = usedCouponModel