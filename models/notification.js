const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId
    },
    count:{
        type:Number,        
    },
    message:[{
        text:{
            type:String
        },
        viewed:{
            type:Boolean,
            default:false
        }        
    }]
})

const notificationModel = mongoose.model('Notification',notificationSchema);
module.exports = notificationModel;