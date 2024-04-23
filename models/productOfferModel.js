const mongoose = require("mongoose");
const Product = require('./productModel');
const productOfferSchema = new mongoose.Schema({
    offer:{
        type:Number
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date,
        index:{expires:'0s'}
    },
    sellingPrice:{
        type:Number
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    }
})

productOfferSchema.pre('remove',async function(next){
    try{
        await Product.updateOne({productOffer:this._id},{$set:{productOffer:null}});
        console.log("product Field updated");
        next()
    }
    catch(error){
        console.log("error when updating offerfied to null",error);
        next()
    }
})


const ProdutOfferModel = mongoose.model('ProductOffer',productOfferSchema);
module.exports = ProdutOfferModel