const mongoose = require("mongoose");
const walletSchema = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId
    },
    walletAmount:{
        type:Number,
        default:0
    },
    creditedDetail:[{   
        amount:{
            type:Number
        },
        transactionType:{
            type:String,
            enem:["credited","debited","failed"]
        },
        source:{
            type:String
        },
        date:{
            type:Date
        }
    }]
});

const WalletModel = mongoose.model("Wallet",walletSchema);
module.exports = WalletModel;