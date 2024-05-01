const mongoose = require("mongoose");
const rewardSchema = new mongoose.Schema({
    referrorOldReward:{
        type:Number,
        default:0
    },
    refereeOldReward:{
        type:Number,
        default:0
    },
    referrorNewReward:{
        type:Number
    },
    refereeNewReward:{
        type:Number
    },
    updateDate:{
        type:Date
    }
})

const rewardModel = mongoose.model("ReferralReward",rewardSchema);
module.exports = rewardModel;