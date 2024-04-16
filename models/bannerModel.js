const mongoose = require("mongoose");
const bannerSchema = new mongoose.Schema({
    image:{
        type:String        
    },
    title:{
        type:String
    },
    deletedAt:{
        type:Date,
        default:null
    }
})

const bannerModel = mongoose.model("Banner",bannerSchema);
module.exports = bannerModel