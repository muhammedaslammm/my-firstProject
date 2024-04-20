const mongoose = require("mongoose");
const categoryOfferSchema = new mongoose.Schema({
    offer:{
        type:Number
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category'
    }
})

const categoryOfferModel = mongoose.model('CategoryModel',categoryOfferSchema);
module.exports = categoryOfferModel