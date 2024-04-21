const mongoose = require("mongoose");
const productOfferSchema = new mongoose.Schema({
    offer:{
        type:Number
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date
    },
    sellingPrice:{
        type:Number
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    }
})

const ProdutOfferModel = mongoose.model('ProductOffer',productOfferSchema);
module.exports = ProdutOfferModel