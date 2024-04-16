const mongoose = require("mongoose");
const app = require("./app");

const mongoConnectionString = process.env.db_connection_string

mongoose.connect(mongoConnectionString).then(function(data){
    console.log("Connected to moasWebsite DataBase");
})
.catch(function(error){
    console.log("Connect to MongoDb database failed",error);
})



app.listen(5000,function(){
    console.log("server waiting for the request in port 5000");
})