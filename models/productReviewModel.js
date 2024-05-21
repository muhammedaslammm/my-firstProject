const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema({    
    productID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product'
    },
    totalRatings:{
        type:Number
    },
    averageRating:{
        type:Number
    },
    userReviews:[{
        userID:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        productReview:{
            type:String
        },
        productRating:{
            type:Number
        },
        date:{
            type:Date
        }
    }]
    
})

const ReviewModel = mongoose.model('ProductReview',reviewSchema);
module.exports = ReviewModel