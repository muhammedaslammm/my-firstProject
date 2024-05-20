const mongoose = require("mongoose");
const returnSchema = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId
    },
    reason:{
        type:String
    }
})

const returnModel = mongoose.model('ReturnReason',returnSchema);
module.exports = returnModel;