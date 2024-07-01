const express = require("express");
const app = express();
const path = require('path');
const dotenv = require("dotenv");
const session = require("express-session");
const nocache = require("nocache");
const clientSession = require('./middlewares/clientSession')
const adminSession = require('./middlewares/adminSession')
const userRouter = require("./routes/userRoutes");
const productsRouter = require("./routes/productsRoutes")
const adminRouter = require("./routes/adminRoutes");
const cartRouter = require("./routes/cartRoutes");
const orderRouter = require("./routes/orderRoutes");
const paymentRouter = require("./routes/paymentRoutes");



app.use(nocache());

app.set("view engine","ejs")
app.set('views',path.join(__dirname,'views'))
app.use(express.json())
app.use(express.urlencoded({extended:false}));
app.use(express.static("public"));
dotenv.config({path:"./config.env"});
console.log(process.env.email_id);


// routes
app.use("/admin",adminSession,adminRouter)
app.use("/",clientSession,userRouter);
app.use("/",clientSession,productsRouter);
app.use("/",clientSession,cartRouter);
app.use("/",clientSession,orderRouter)
app.use("/",clientSession,paymentRouter)

function pageNotFound(req,res,next){
    res.status(404).render("invalidURL")
}
app.use(pageNotFound)

// handling controller errors
app.use(function(error,req,res,next){
    const userID = req.session ? req.session.userID : null;
    console.log('some error occured',error);
    res.status(500).render('errorPage',{userID})
})

module.exports = app
