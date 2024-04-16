const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    category:{
        type:String
    },
    deletedAt:{
        type:Date,
        default:null
    }
})

const Category = mongoose.model("Category",categorySchema);
module.exports = Category;