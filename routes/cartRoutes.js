const express = require("express")
const router = express.Router();
const cartController = require("./../controllers/cartController");
const User = require("./../models/userModel");

const authentication = async function(req,res,next){
    if(req.session.userID){
        const userData = await User.findById(req.session.userID);
        if(userData && userData.isBlocked){
            console.log("user access denied");
            res.redirect("/login")
        }
        else{
            next()
        }
    }
    else{
        res.redirect("/login")
    }
}

router.get("/product-addToCart",authentication,cartController.addtoCart);
router.get("/cart-page",authentication,cartController.cartPage)
router.post("/increase-product-quantity",authentication,cartController.increaseQuantity)
router.post("/decrease-product-quantity",authentication,cartController.decreaseQuantity)
router.post("/product-removefrom-cart",authentication,cartController.removeFromCart)
router.post("/add-coupon-product",authentication,cartController.addCoupon2Product);
router.get("/get-coupon",authentication,cartController.getCouponDetails)
router.post("/cancel-coupon",authentication,cartController.cancelCoupon)
// checkout page
router.get("/checkout-page",authentication,cartController.checkoutPage);
router.get('/add-new-address',authentication,cartController.checkoutAddressPage);
router.post('/add-new-address',authentication,cartController.checkoutAddressPost);
router.post("/setDefaultAddress",authentication,cartController.setDefaultAddress)
module.exports = router;    