const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId
    },
    username: {
        type: String
    },
    orderedProducts: [{
        cartID: {
            type: mongoose.Schema.Types.ObjectId
        },
        productID: {
            type: mongoose.Schema.Types.ObjectId
        },
        moasOrderID: {
            type: String
        },
        orderStatus: {
            type: String,
            default: 'on progress'
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
        image: {
            type: String
        },
        brand: {
            type: String
        },
        color: {
            type: String
        },
        productType: {
            type: String
        },
        price: {
            type: Number
        },
        quantity: {
            type: Number
        },
        size: {
            type: String
        },
        totalPrice: {
            type: Number
        }
    }],
    orderedDate: {
        type: Date
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    },
    paymentMethod: {
        type: String
    }
})

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;