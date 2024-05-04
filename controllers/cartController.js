const express = require('express')
const app = express();
const nocache = require("nocache");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Address = require("./../models/addressModel");
const User = require("./../models/userModel");
const Coupon = require("./../models/couponModel");
const UsedCoupon = require("./../models/usedCouponModel");
const Wallet = require("./../models/walletModel");


app.use(nocache())

// adding product to cart
exports.addtoCart = async function(req,res){
    const userID = req.session.userID;
    const {productID,quantity,size} = req.query
    try{
        const cart = await Cart.create({
            userID,productID,quantity,size
        })
        console.log("product added to cart");
        await Product.findByIdAndUpdate(productID,{addedToCart:true})
        res.redirect("/cart-page");
    }
    catch(error){
        console.log("some error occured",error);
    }
}


// cart page
exports.cartPage = async function(req,res){
    const userID = req.session.userID;
    try{
        const carts = await Cart.find({userID})
        .populate({
            path:'productID',
            populate:{
                path:'productOffer'
            }
        })
        const totalCart = carts.length; 
        
        const totalAmount = carts.reduce(function(currentTotal,cart){
            if(cart.productID.productOffer){
                currentTotal += cart.productID.productOffer.sellingPrice * cart.quantity;                
            }
            else{
                currentTotal += cart.productID.sellingPrice * cart.quantity
            }
            return currentTotal
            
        },0)       

        res.render("cartPage",{carts,totalCart:totalCart,totalAmount,userID});
    }
    catch(error){
        console.log("something went wrong",error);
    }
}


// increase the quantity
exports.increaseQuantity = async function(req,res){
    try{
        const {cartID,currentQuantity} = req.body;
        const userID = req.session.userID;
        const cart = await Cart.findOne({_id:cartID}).populate('productID');
        const cartSize = cart.size;
        if(cart.productID[cartSize] === 0){
            res.status(200).json({cartError:'page need redirection'})
        }
        else if(cart.productID[cartSize] > 6 &&  parseInt(currentQuantity) < 6){
            console.log(cart.productID[cartSize]);
            const qtyUpdate = await Cart.updateOne({_id:cartID},{$inc:{quantity:1}})
            const carts = await Cart.find({userID})
            .populate({
                path:'productID',
                populate:{
                    path:'productOffer'
                }
            });
            const totalAmount = carts.reduce(function(currentAmount,cart){
                if(cart.productID.productOffer){
                    currentAmount += cart.productID.productOffer.sellingPrice * cart.quantity
                }
                else{
                    currentAmount += cart.productID.sellingPrice * cart.quantity
                }
                return currentAmount
            },0)
            const currentCart = await Cart.findById(cartID)
            

            res.status(200).json({totalAmount:totalAmount,quantity:currentCart.quantity});
        }
        else if(cart.productID[cartSize] <= 6 && parseInt(currentQuantity) < cart.productID[cartSize] ){
            console.log(cart.productID[cartSize]);
            const qtyUpdate = await Cart.updateOne({_id:cartID},{$inc:{quantity:1}})
            const carts = await Cart.find({userID}).populate('productID');
            const totalAmount = carts.reduce(function(currentAmount,cart){
                return currentAmount+= cart.productID.sellingPrice * cart.quantity
            },0)
            const currentCart = await Cart.findById(cartID)
            

            res.status(200).json({totalAmount:totalAmount,quantity:currentCart.quantity});
        }
        else{            
            res.status(200).json({limitError:"quantity count exceeded the limit"})
            }
            
    }
    catch(error){
        console.log(error);
        res.status(500).json({error:'failed to update the quantity'})
    }
}

// decrease quantity
exports.decreaseQuantity = async function(req,res){
    try{
        const {cartID,currentQuantity,currentTotalPrice} = req.body;
        const userID = req.session.userID
        if(parseInt(currentQuantity) === 1){
            res.status(200).json({limitError:"cant place order with no quantity"})
        }
        else{
            const updatedCart = await Cart.findByIdAndUpdate(cartID,{$inc:{quantity:-1}}); 
            const currentCart = await Cart.findById(cartID)            
            .populate({
                path:'productID',
                populate:{
                    path:'productOffer'
                }
            })
            let totalAmount = 0
            if(currentCart.productID.productOffer){
                totalAmount = currentTotalPrice - currentCart.productID.productOffer.sellingPrice;
            }
            else{
                totalAmount = currentTotalPrice - currentCart.productID.sellingPrice;
            }            
            res.json({totalAmount,quantity:currentCart.quantity})
        }
    }
    catch(error){
        console.log("error occured when reducing quantity",error);
        res.status(500).json({error:"failed to update the quantity"})
    }
}

// remove product from cart
exports.removeFromCart = async function(req,res){
    try{
        const {cartID,cartTotal} = req.body;
        const cart = await Cart.findById(cartID).populate('productID'); 
        const deletedCartTotal = cart.quantity * cart.productID.sellingPrice ;
        const newCartTotal = cartTotal - deletedCartTotal      
        await Cart.findByIdAndDelete(cartID);
        await Product.findByIdAndUpdate(cart.productID,{addedToCart:false})
        console.log("cart deleted");
        res.status(200).json({message:'cart deleted',newCartTotal})
    }
    catch(error){
        console.log("error in deleting cart product",error);
        res.status(500).json({error:'failed to remove cart Itme'})

    }
    
}


// checkout- page
exports.checkoutPage = async function(req,res){
    const userID = req.session.userID
    try{
        const userCart = await Cart.find({userID})
        .populate({
            path:'productID',
            populate:{
                path:'productOffer'
            }
        });
        const totalQuantity = userCart.reduce(function(currentTotal,cart){
            return currentTotal += cart.quantity
        },0)
        const totalAmount = userCart.reduce(function(currentTotal,cart){
            if(cart.productID.productOffer){
                currentTotal += cart.productID.productOffer.sellingPrice * cart.quantity;
            }
            else{   
                currentTotal += cart.productID.sellingPrice * cart.quantity
            }
            return currentTotal
        },0)
        console.log(totalAmount);

        // user address
        const defaultAddress = await Address.findOne({userID,default:true})
        const addresses = await Address.find({userID:userID});

        // collecting wallet
        const wallet = await Wallet.findOne({userID})
        const walletTotal = wallet.walletAmount;
        console.log(walletTotal);

        // collecting available coupons
        const usedCouponsIDs = (await UsedCoupon.find({userID:req.session.userID})).map(function(usedCoupon){
            return usedCoupon.couponID;
        })
        const coupons = await Coupon.find({_id:{$nin:usedCouponsIDs}})           
        const productCoupons = coupons.filter(function(coupon){
            if(totalAmount > coupon.minimumAmount){
                return coupon
            }
        })           
        res.render("checkoutPage",{userCart,totalQuantity,totalAmount,addresses,defaultAddress,userID,coupons:productCoupons,walletTotal})
    }
    catch(error){
        console.log("error occured when rendering checkout page",error);
    }
}

// checkoutpage add address
exports.checkoutAddressPage = async function(req,res){
    try{
        const userID = req.session.userID;
        res.render("checkoutAddress",{userID})
    }
    catch(error){
        console.log(error,"error to render address page to add address");
    }
}

// checkout address adding to db
exports.checkoutAddressPost = async function(req,res){
    try{
        const userID = req.session.userID
        const address = req.body;
        address.userID = userID
        const newAddress = await Address.create(address);
        console.log("address added to db");
        res.redirect("/checkout-page")
    }
    catch(error){
        console.log(error,"error when adding address to database");
    }
}


// manage address
exports.setDefaultAddress = async function(req,res){
    try{
        const addressID = req.body.addressID;
        const userID = req.session.userID;
        await Address.updateMany({userID},{$set:{default:false}});
        const address = await Address.findByIdAndUpdate(addressID,{default:true});
        if(address){
            res.json({address})
        }
        else{
            res.status(404).json({message:"error when updating address via fetch"})
        }
        // console.log(addresses);
    }
    catch(error){
        res.status(404).json({message:error})
    }
}

// add coupon to product
exports.addCoupon2Product = async function(req,res){
    const {couponCode, totalAmount} = req.body
    const userID = req.session.userID;
    try{
        const coupon = await Coupon.findOne({couponCode});        
        if(coupon){     
            const usedCoupons = await UsedCoupon.find({userID});             
            const matchingCoupon = usedCoupons.find(function(usedCoupon){
                return usedCoupon.couponID === coupon._id;
            })
            if(matchingCoupon){
                res.status(409).json({error:"coupon already in use"})
            }
            else{                
                const deducted = Math.round(totalAmount * (coupon.offerAmount/100));
                const newAmount = Math.round(totalAmount - deducted)
                const deductedAmount = -deducted
                
                const usedCoupon = await UsedCoupon.create({
                    userID:req.session.userID,
                    couponID:coupon._id,
                    purchaseAmount:totalAmount,
                    newAmount,
                    deductedAmount,
                    couponUsed:true,
                    usedDate:new Date
                })
                console.log(`${couponCode} used`);
                res.status(200).json({
                    newAmount:usedCoupon.newAmount,
                    deductedAmount:usedCoupon.deductedAmount,
                    usedCouponDoc:usedCoupon._id,
                    couponID:usedCoupon.couponID
                })
            }             
        }
        else{
            res.status(404).json({error:'invalid coupon code'})
        }        
    }
    catch(error){
        console.log("error when adding coupon to product",error);
        res.status(500).json({error:'failed'})
    }
}

// get coupon details
exports.getCouponDetails = async function(req,res){
    const usedCouponID = req.query.couponID;
    try{
        const usedCoupon = await UsedCoupon.findById(usedCouponID);
        res.status(200).json({
            newAmount:usedCoupon.newAmount,
            deductedAmount:usedCoupon.deductedAmount,
        })
    }
    catch(error){
        console.log("error",error);
        res.status(404).json({error:'error'})
    }
}

// cancel the product coupon
exports.cancelCoupon = async function(req,res){
    const usedCouponID = req.body.usedCouponID;
    try{
        await UsedCoupon.findByIdAndDelete(usedCouponID);
        console.log("coupon cancelled");
        res.status(200).json({success:"coupon deleted"})
    }
    catch(error){
        console.log("error when cancelling coupon",error);
    }
}