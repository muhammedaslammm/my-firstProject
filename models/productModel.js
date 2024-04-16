const mongoose = require("mongoose");
const paginate = require('mongoose-paginate-v2');
const productSchema = new mongoose.Schema({
    images:{
        type:[String]
    },   
    brand:{
        type:String
    },
    actualPrice:{
        type:Number
    },
    sellingPrice:{
        type:Number
    },
    discount:{
        type:Number
    },
    rating:{
        type:Number
    },
    numberOfRating:{
        type:Number
    },
    
    // ------------
    category:{
        type:String
    },
    discount:{
        type:Number
    },
    productType:{
        type:String
    },
    extra_small:{
        type:Number,
        default:0
    },
    small:{
        type:Number,
        default:0
    },
    medium:{
        type:Number,
        default:0
    },
    large:{
        type:Number,
        default:0
    },
    extra_large:{
        type:Number,
        default:0
    },
    extra_extra_large:{
        type:Number,
        default:0
    },
    status:{
        type:String
    },
    date:{
        type:Date
    },

    // ------------
    sleeve:{
        type:String
    },
    fit:{
        type:String
    },
    pattern:{
        type:String
    },
    wash:{
        type:String
    },
    color:{
        type:String
    },
    fabric:{
        type:String
    },
    deletedAt:{
        type:Date,
        default:null
    },
    addedToCart:{
        type:Boolean,
        default:false
    }

})
productSchema.plugin(paginate)
productSchema.index({
    brand:'text',
    color:'text',
    productType:'text',
    pattern:'text',
    fabric:'text'
})


const Product = mongoose.model("Product",productSchema);
module.exports = Product;