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
exports.addtoCart = async function(req,res,next){
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
        next(error)
    }
}


// cart page
exports.cartPage = async function(req,res,next){
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
        let totalAmount = 0;
        let bagTotal = 0;
        let totalGST = 0;
        carts.forEach(function(item){
            if(item.productID.productOffer){
                const sellingPrice = item.productID.productOffer.sellingPrice;
                bagTotal += sellingPrice * item.quantity;
                if(sellingPrice > 1000){
                    const itemSellingPrice = sellingPrice * item.quantity
                    const gstAmount = Math.round(itemSellingPrice * (12/100));
                    totalGST += gstAmount;
                    totalAmount += itemSellingPrice + gstAmount;
                }
                else{
                    const itemSellingPrice = sellingPrice * item.quantity
                    const gstAmount = Math.round(itemSellingPrice * (5/100));
                    totalGST += gstAmount;
                    totalAmount += itemSellingPrice + gstAmount;
                }
            }
            else{
                const sellingPrice = item.productID.sellingPrice;
                bagTotal += sellingPrice * item.quantity;;
                if(sellingPrice > 1000){
                    const itemSellingPrice = sellingPrice * item.quantity
                    const gstAmount = Math.round(itemSellingPrice * (12/100));
                    totalGST += gstAmount
                    totalAmount += itemSellingPrice + gstAmount
                }
                else{
                    const itemSellingPrice = sellingPrice * item.quantity
                    const gstAmount = Math.round(itemSellingPrice * (5/100));
                    totalGST += gstAmount;
                    totalAmount += itemSellingPrice + gstAmount
                }
            }
        })

        res.render("cartPage",{
            carts,
            totalCart:totalCart,
            totalAmount,
            bagTotal,
            totalGST,
            userID
        });
    }
    catch(error){
        next(error)
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
            const [totalAmount,bagTotal,totalGST] = await addCalculateRate(userID);           

            const currentCart = await Cart.findById(cartID)
            res.status(200).json({
                totalAmount:totalAmount,
                quantity:currentCart.quantity,
                bagTotal,
                totalGST
            });
        }
        else if(cart.productID[cartSize] <= 6 && parseInt(currentQuantity) < cart.productID[cartSize] ){
            console.log(cart.productID[cartSize]);
            const qtyUpdate = await Cart.updateOne({_id:cartID},{$inc:{quantity:1}})
            const [totalAmount, totalGST, bagTotal] = await addCalculateRate()
            const currentCart = await Cart.findById(cartID)            

            res.status(200).json({
                totalAmount:totalAmount,
                quantity:currentCart.quantity,
                totalGST,
                bagTotal
            });
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
// function to calculate the amount rates
async function addCalculateRate(userID){
    const carts = await Cart.find({userID})
            .populate({
                path:'productID',
                populate:{
                    path:'productOffer'
                }
            }); 
    let totalAmount = 0;
    let bagTotal = 0
    let totalGST = 0;
    carts.forEach(function(item){
        if(item.productID.productOffer){
            const sellingPrice = item.productID.productOffer.sellingPrice;
            bagTotal += sellingPrice * item.quantity
            if(sellingPrice > 1000){
                const sellingPriceQtyAdded = sellingPrice * item.quantity;
                const gstAmount = Math.round(sellingPriceQtyAdded * (12/100));
                totalGST += gstAmount;
                totalAmount += sellingPriceQtyAdded + gstAmount;
            }
            else{
                const sellingPriceQtyAdded = sellingPrice * item.quantity;
                const gstAmount = Math.round(sellingPriceQtyAdded * (5/100));
                totalGST += gstAmount;
                totalAmount += sellingPriceQtyAdded + gstAmount;
            }
        }
        else{
            const sellingPrice = item.productID.sellingPrice;
            bagTotal += sellingPrice * item.quantity
            if(sellingPrice > 1000){
                const sellingPriceQtyAdded = sellingPrice * item.quantity;
                const gstAmount = Math.round(sellingPriceQtyAdded * (12/100));
                totalGST += gstAmount;
                totalAmount += sellingPriceQtyAdded + gstAmount;
            }
            else{
                const sellingPriceQtyAdded = sellingPrice * item.quantity;
                const gstAmount = Math.round(sellingPriceQtyAdded * (5/100));
                totalGST += gstAmount;
                totalAmount += sellingPriceQtyAdded + gstAmount;
            }

        }
    }) 
    return [totalAmount,bagTotal,totalGST];
}

// decrease quantity
exports.decreaseQuantity = async function(req,res){
    try{
        const {cartID,currentQuantity,currentTotalPrice,currentBagTotal} = req.body;
        const userID = req.session.userID
        if(parseInt(currentQuantity) === 1){
            res.status(200).json({limitError:"cant place order with no quantity"})
        }
        else{
            const updatedCart = await Cart.findByIdAndUpdate(cartID,{$inc:{quantity:-1}});
            const cartItems = await Cart.find({userID})
            .populate({
                path:'productID',
                populate:{
                    path:'productOffer'
                }
            })
            let totalAmount = 0
            let bagTotal = 0;
            let totalGST = 0;
            cartItems.forEach(function(item){
                if(item.productID.productOffer){
                    const sellingPrice = item.productID.productOffer.sellingPrice;
                    bagTotal += sellingPrice * item.quantity;
                    if(sellingPrice > 1000){
                        const itemSellingPrice = sellingPrice * item.quantity;
                        const gstAmount = Math.round(itemSellingPrice * (12/100));
                        totalGST += gstAmount;
                        totalAmount += itemSellingPrice + gstAmount;
                    }
                    else{
                        const itemSellingPrice = sellingPrice * item.quantity;
                        const gstAmount = Math.round(itemSellingPrice * (5/100));
                        totalGST += gstAmount;
                        totalAmount += itemSellingPrice + gstAmount;
                    }
                }
                else{
                    const sellingPrice = item.productID.sellingPrice;
                    bagTotal += sellingPrice * item.quantity;
                    if(sellingPrice > 1000){
                        const itemSellingPrice = sellingPrice * item.quantity;
                        const gstAmount = Math.round(itemSellingPrice * (12/100));
                        totalGST += gstAmount;
                        totalAmount += itemSellingPrice + gstAmount;
                    }
                    else{
                        const itemSellingPrice = sellingPrice * item.quantity;
                        const gstAmount = Math.round(itemSellingPrice * (5/100));
                        totalGST += gstAmount;
                        totalAmount += itemSellingPrice + gstAmount;
                    }
                }
            })  
            
            const currentCart = await Cart.findById(cartID)                        
            res.json({
                totalAmount,
                bagTotal,
                totalGST,
                quantity:currentCart.quantity
            })
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
exports.checkoutPage = async function(req,res,next){
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
        let gstAmount = 0;
        let totalAmount = 0;
        let bagTotal = 0;
        userCart.forEach(function(item){
            // product with offer
            if(item.productID.productOffer){
                const sellingPrice = item.productID.productOffer.sellingPrice;
                bagTotal += sellingPrice * item.quantity;
                if(sellingPrice > 1000){
                    let gst = Math.round(sellingPrice * (12/100));
                    gstAmount += gst;
                    totalAmount += (sellingPrice + gst) * item.quantity;
                }
                else{
                    let gst = Math.round(sellingPrice * (5/100));
                    gstAmount += gst;
                    totalAmount += (sellingPrice + gst) * item.quantity;
                }
            }
            // product without offer
            else{
                const sellingPrice = item.productID.sellingPrice;
                bagTotal += sellingPrice * item.quantity;
                if(sellingPrice > 1000){
                    let gst = Math.round(sellingPrice * (12/100));
                    gstAmount += gst;
                    totalAmount += (sellingPrice + gst) * item.quantity;
                }
                else{
                    let gst = Math.round(sellingPrice * (5/100));
                    gstAmount += gst;
                    totalAmount += (sellingPrice + gst) * item.quantity;
                }
            }
        })

    

        // user address
        const defaultAddress = await Address.findOne({userID,default:true})
        const addresses = await Address.find({userID:userID});

        // collecting wallet
        let walletTotal = 0;
        const wallet = await Wallet.findOne({userID})
        if(wallet){
            walletTotal = wallet.walletAmount
            console.log("wallet total ",walletTotal);
        }
        

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
        console.log("total amount",totalAmount);
        console.log("available coupons: ",productCoupons);       
        res.render("checkoutPage",{
            userCart,
            totalQuantity,
            totalAmount,
            bagTotal,
            addresses,
            defaultAddress,
            userID,
            coupons:productCoupons,
            walletTotal,
            gstAmount
        })
    }
    catch(error){
        next(error)
    }
}

// checkoutpage add address
exports.checkoutAddressPage = async function(req,res,next){
    try{
        const userID = req.session.userID;
        res.render("checkoutAddress",{userID})
    }
    catch(error){
        next(error)
    }
}

// checkout address adding to db
exports.checkoutAddressPost = async function(req,res,next){
    try{
        const userID = req.session.userID
        const address = req.body;
        address.userID = userID
        const newAddress = await Address.create(address);
        console.log("address added to db");
        res.redirect("/checkout-page")
    }
    catch(error){
        next(error)
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
                const deductedAmount = deducted
                
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
exports.cancelCoupon = async function(req,res,next){
    const usedCouponID = req.body.usedCouponID;
    try{
        await UsedCoupon.findByIdAndDelete(usedCouponID);
        console.log("coupon cancelled");
        res.status(200).json({success:"coupon deleted"})
    }
    catch(error){
        next(error)
    }
}