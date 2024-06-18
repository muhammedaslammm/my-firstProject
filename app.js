const express = require("express");
const app = express();
const dotenv = require("dotenv");
const session = require("express-session");
const nocache = require("nocache");
const mongodbStore = require("connect-mongodb-session")(session);
const userRouter = require("./routes/userRoutes");
const productsRouter = require("./routes/productsRoutes")
const adminRouter = require("./routes/adminRoutes");
const cartRouter = require("./routes/cartRoutes");
const orderRouter = require("./routes/orderRoutes");
const paymentRouter = require("./routes/paymentRoutes");



app.use(nocache());
app.use(session({
    secret:"s3cr3tc87od637e",
    saveUninitialized:false,
    resave:false,
    store:new mongodbStore({
        uri:"mongodb://localhost:27017/moasWebsite",
        collection:"session"
    })
}))


app.set("view engine","ejs")
app.use(express.json())
app.use(express.urlencoded({extended:false}));
app.use(express.static("public"));
dotenv.config({path:"./config.env"});
console.log(process.env.email_id);


// routes
app.use("/admin",adminRouter)
app.use("/",userRouter);
app.use("/",productsRouter);
app.use("/",cartRouter);
app.use("/",orderRouter)
app.use("/",paymentRouter)

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
