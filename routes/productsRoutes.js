const express = require("express");
const User = require("./../models/userModel");
const productsController = require("../controllers/productsController");
const router = express.Router();


const authentication = async function(req,res,next){
    if(req.session.userID){
        const userID = req.session.userID;
        const userData = await User.findById(userID);
        if(userData.isBlocked){
            req.session.destroy(function(error){
                if(error){
                    console.log("failed to destroy session");
                    res.redirect("/login?message='Authentication Failed'");
                }
                else{
                    console.log("session destroyed");
                    res.redirect("/login?message='Authentication Failed'")
                }
            });            
        }
        else{
            next()
        }
    }
    else{
        res.redirect("/login")
    }
}

router.get("/",productsController.landingPage);
router.get("/search",productsController.searchResult)

// selected category    
router.get("/category/:categoryName",productsController.products)

// selected product
router.get("/category/:category/:id",productsController.selectedProduct);

// get the size's quantity
router.get('/getQuantity/:productID',productsController.getQuantity)

// add address if needed
router.post("/category/:category/:id",authentication,productsController.buttonClick);
router.get("/product-addAddress",productsController.product_addAddress);
router.post("/product-addAddress",productsController.addProduct_Address);

// wishlist
router.post("/addToWishlist",authentication,productsController.addToWishlist);
router.get("/wishlist",authentication,productsController.wishlistPage);
router.post("/removeFrom-wishlist",authentication,productsController.removeFromWishlist)

// add review
router.post('/addProductReview',authentication,productsController.addProductReview)

module.exports = router
