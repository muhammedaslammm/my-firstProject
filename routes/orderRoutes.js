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
router.post('/continue-payment',authentication,orderController.continuePayment)
router.get('/order-response-page',authentication,orderController.orderResponsePage);
router.get("/order-page",authentication,orderController.orderPage);
router.get("/view/:orderID/:productDocID",authentication,orderController.viewOrderedProduct)
router.post("/cancel-order",authentication,orderController.cancelOrder);
router.get('/return/:orderID/:docID',authentication,orderController.getOrderReturnPage);
router.post('/return/:orderID/:docID',authentication,orderController.submitOrderReturn);



module.exports = router;