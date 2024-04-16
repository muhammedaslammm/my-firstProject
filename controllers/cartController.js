const express = require('express')
const app = express();
const nocache = require("nocache");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Address = require("./../models/addressModel");
const User = require("./../models/userModel")


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
        const cart = await Cart.find({userID}).populate('productID'); 
        const totalCart = cart.length; 
        
        const totalAmount = cart.reduce(function(currrentTotal,cart){
            return currrentTotal+=cart.productID.sellingPrice*cart.quantity
        },0)        

        res.render("cartPage",{Cart:cart,totalCart:totalCart,totalAmount,userID});
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
        console.log(cartSize);
        if(cart.productID[cartSize] === 0){
            res.status(200).json({cartError:'page need redirection'})
        }
        else if(cart.productID[cartSize] > 6 &&  parseInt(currentQuantity) < 6){
            console.log(cart.productID[cartSize]);
            const qtyUpdate = await Cart.updateOne({_id:cartID},{$inc:{quantity:1}})
            const carts = await Cart.find({userID}).populate('productID');
            const totalAmount = carts.reduce(function(currentAmount,cart){
                return currentAmount+= cart.productID.sellingPrice * cart.quantity
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
            const currentCart = await Cart.findById(cartID).populate('productID');
            const totalAmount = currentTotalPrice - currentCart.productID.sellingPrice;
            console.log(currentCart.quantity);
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
        const cartID = req.params.id;
        const cart = await Cart.findById(cartID).populate('productID'); 
        const deletedCartTotal = cart.quantity * cart.productID.sellingPrice       
        await Cart.findByIdAndDelete(cartID);
        await Product.findByIdAndUpdate(cart.productID,{addedToCart:false})
        

        console.log("cart deleted");
        res.status(200).json({message:'cart deleted',deletedCartTotal})
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
        const userCart = await Cart.find({userID}).populate('productID');
        const totalQuantity = userCart.reduce(function(currentTotal,cart){
            return currentTotal += cart.quantity
        },0)
        const totalAmount = userCart.reduce(function(currentTotal,cart){
            return currentTotal += cart.productID.sellingPrice * cart.quantity
        },0)

        // user address
        const defaultAddress = await Address.findOne({userID,default:true})
        const addresses = await Address.find({userID:userID});
        res.render("checkoutPage",{userCart,totalQuantity,totalAmount,addresses,defaultAddress,userID})
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