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
        orderStatus: {
            type: String,
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
    orderStatus:{
        type:String,
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
    paymentMethod: {
        type: String
    },
    couponAdded:{
        type:Boolean,
        default:false
    }
})

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;