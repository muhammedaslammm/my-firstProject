const mongoose = require("mongoose");
const app = require("./app");

const mongoConnectionString = process.env.MONGODB_URI

async function connectToDatabase(connectionString){
    try{
        const connection = await mongoose.connect(connectionString,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        });
        console.log('database connection successfull');
    }
    catch(error){
        console.log('database connection failed',error);
    }
}

connectToDatabase(mongoConnectionString);


app.listen(5000,'0.0.0.0',function(){
    console.log("server waiting for the request in port 5000");
})