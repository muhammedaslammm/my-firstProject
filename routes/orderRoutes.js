const express = require("express");
const router = express.Router();
const orderController = require("./../controllers/orderController");
const User = require("./../models/userModel")
const authentication = async function(req,res,next){
    try{
        const userID = req.session.userID;
        if(userID){
            const user = await User.findById(userID);
            if(user.isBlocked){
                res.redirect("/login");
            }
            else{
                next()
            }
        }
        else{
            res.redirect("/login")
        }
    }
    catch(error){
        console.log("user authentication failed",error);        
    }
}


router.post("/place-order",authentication,orderController.placeOrder);
router.get('/order-response-page',authentication,orderController.orderResponsePage);
router.get("/order-page",authentication,orderController.orderPage);
router.get("/view/:order_id/:product_id",authentication,orderController.viewOrderedProduct)
router.post("/cancel/:order_id/:product_id",authentication,orderController.cancelOrder);



module.exports = router;