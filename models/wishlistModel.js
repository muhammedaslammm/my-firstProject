const mongoose = require('mongoose');
const wishlistSchema = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId        
    },
    productID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product'
    }
})

const wishlistModel = mongoose.model('Wishlist',wishlistSchema);

module.exports = wishlistModel;