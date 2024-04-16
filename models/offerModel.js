const mongoose = require("mongoose");
const offerSchema = new mongoose.Schema({
    offer:{
        type:Number
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date
    },
    product:{
        type:mongoose.Schema.Types.ObjectId
    }    
})

const Offer = mongoose.model('Offer',offerSchema);
module.exports = Offer