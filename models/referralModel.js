const mongoose = require("mongoose");
const referralSchema = new mongoose.Schema({
    referrorID:{
        type:mongoose.Schema.Types.ObjectId
    },
    refereeID:{
        type:mongoose.Schema.Types.ObjectId
    },
    referralCode:{
        type:String
    },
    referrorReward:{
        type:Number
    },
    refereeReward:{
        type:Number
    },
    Date:{
        type:Date
    }
});

const referralModel = mongoose.model("Referral",referralSchema);
module.exports = referralModel