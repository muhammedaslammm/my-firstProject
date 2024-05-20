const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId
    },
    username:{
        type:String
    },
    orderedProducts: [{        
        productID: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Product'
        },
        moasOrderID: {
            type: String
        },
        quantity: {
            type: Number
        },
        size: {
            type: String
        },
        totalPrice: {
            type: Number
        },
        offer:{
            type:Number,
            default:0
        },
        couponAdded:{
            type:Boolean,
            default:false
        },
        orderStatus: {
            type: String,
        },
        returnReason:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'ReturnReason',
            default:null
        },
        returnedDate:{
            type:Date,
            default:null
        },
        cancelledDate: {
            type: Date,
            default: null
        },
        deliveryDate: {
            type: Date,
            default: null
        },
        deliveredDate: {
            type: Date,
            default: null
        },        
        
    }],
    orderedDate: {
        type: Date
    },
    cancelledDate:{
        type:Date
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    },  
    orderTotal:{
        type:Number
    },
    productTotal:{
        type:Number
    },
    couponOffer:{
        type:Number,
        default:0
    },    
    couponAdded:{
        type:Boolean,
        default:false
    },
    usedCouponID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UsedCoupon'
    },
    paymentMethod: {
        type: String
    }
})

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;