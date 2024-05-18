const Order = require("./../models/orderModel");
const Cart = require("./../models/cartModel");
const Product = require("./../models/productModel");
const User = require("../models/userModel");
const Address = require("./../models/addressModel");
const Wallet = require("./../models/walletModel")
const {ObjectId} = require("mongodb");
const generateOrderID = require('./../operations/generateOrderID');
const UsedCoupon = require("./../models/usedCouponModel");


// placing order 'cash on delivery'
exports.placeOrder = async function(req,res){
    try{
        const {address,cartID,payment,orderTotal,usedCouponID} = req.body;        
        const userID = req.session.userID;
        const user = await User.findById(userID);
        let carts = [];
        if(typeof cartID != 'string'){
            const promise = cartID.map(async function(id){
                return await Cart.findById(id)
                .populate({
                    path:'productID',
                    populate:{
                        path:'productOffer'
                    }
                });
            })
            carts = await Promise.all(promise);
        }
        else{
            const cart = await Cart.findById(cartID)
            .populate({
                path:'productID',
                populate:{
                    path:'productOffer'
                }
            });
            carts.push(cart);
        }
        
        // setting the orderedProducts array in the order doc
        const date = new Date();
        const newDate = date.setDate(date.getDate() + 3)
        const deliveryDate = new Date(newDate)
        const orderedProducts = [];
        let productTotal = 0
        carts.forEach(function(cart){
            const moasOrderID = generateOrderID()
            let totalPrice = 0;
            if(cart.productID.productOffer){
                totalPrice += cart.productID.productOffer.sellingPrice * cart.quantity;
                productTotal += totalPrice;
            }
            else{
                totalPrice += cart.productID.sellingPrice * cart.quantity;
                productTotal += totalPrice;
            }

            // adding offer value
            let offer = null;
            if(cart.productID.productOffer){
                offer = cart.productID.productOffer.offer
            }
            const productDetails = {
                productID:cart.productID._id,
                moasOrderID,               
                quantity:cart.quantity,
                size:cart.size, 
                totalPrice,
                orderStatus:"on progress",
                offer,              
                deliveryDate,
            }
            if(usedCouponID){
                productDetails.couponAdded = true;
            }  
            orderedProducts.push(productDetails);
        })

        // handling wallet if payment is via wallet\
        if(payment === 'wallet'){
            const wallet = await Wallet.findOne({userID});
            const walletAmount = wallet.walletAmount - orderTotal
            const newWallet = {
                amount:orderTotal,
                transactionType:"debited",
                source:"Product Purchase",
                date:new Date
            }
            await Wallet.updateOne({userID},{$set:{walletAmount},$push:{creditedDetail:newWallet}})
        }
        
        // ordering data
        const order = new Order({
            userID,
            username:user.username,
            orderedProducts,
            orderedDate:new Date(),
            address,
            orderTotal,
            productTotal,
            paymentMethod:payment
        })
        if(usedCouponID){
            const coupon = await UsedCoupon.findById(usedCouponID).populate('couponID');
            order.couponAdded = true;
            order.couponOffer = coupon.couponID.offerAmount;
            order.usedCouponID = usedCouponID
        }
        await order.save(); 
        console.log(order);

        // clear cart
        if(typeof cartID === 'string'){
            const cart = await Cart.findById(cartID);
            await Product.updateOne({_id:cart.productID},{$set:{addedToCart:false}});
            await Cart.deleteOne({_id:cartID});
        }
        else{
            cartID.forEach(async function(id){
                const cart = await Cart.findById(id);
                await Product.updateOne({_id:cart.productID},{$set:{addedToCart:false}})
                await Cart.deleteOne({_id:id});
            })
        }

        // deducting quantity
        for(let product of order.orderedProducts){
            const size = product.size;
            await Product.updateOne({_id:product.productID},{$inc:{[size]:-product.quantity}});
        }

        
        const orderID = order._id 
        console.log("alhamdulillah");
        console.log("order placed!");        
        res.redirect(`/order-response-page?order_id=${orderID}`);
       
    }
    catch(error){
        console.log("some error occured",error);
    }
}

// order response page
exports.orderResponsePage = async function(req,res){
    try{
        const userID = req.session.userID
        const orderID = req.query.order_id;
        const order = await Order.findOne({_id:orderID})
            .populate('orderedProducts.productID')
            .populate("address");
        res.render("orderResponsePage",{userID,order})       
    }
    catch(error){
        console.log("error in order response page",error);
    }
}



// order page
exports.orderPage = async function(req,res){
    try{
        const userID = req.session.userID
        const orders = await Order.find({userID}).populate('orderedProducts.productID').sort({orderedDate:-1});
        
        const statuses = ["on progress","shipped","delivered"]
        res.render("orderPage",{orders,statuses,userID});        
    }
    catch(error){
        console.log("somm error in order page",error);
    }
}

// view ordered product
exports.viewOrderedProduct = async function(req,res){
    const {orderID,productDocID} = req.params
    const userID = req.session.userID
    try{
        const order = await Order.findById(orderID).populate('orderedProducts.productID').populate("address")
        const product = order.orderedProducts.find(function(product){
            return product._id.toString() === productDocID;
        })        
        const statuses = ["on progress","pending"]
        res.render("orderedProduct",{product,order,statuses,userID});
    }
    catch(error){
        console.log(error,"error when viewing ordered product");
        res.redirect("/order-page")
    }
}

// cancel order
exports.cancelOrder = async function(req,res){
    try{
        const {orderID,docID} = req.body
        const cancelledDate = Date.now();  
        const userID = req.session.userID;        

        const updateStatus = await Order.updateOne(
            {_id:orderID,'orderedProducts._id':docID},
            {$set:{
                'orderedProducts.$.orderStatus':'cancelled',
                'orderedProducts.$.cancelledDate':cancelledDate,
                'orderedProducts.$.deliveryDate':null,                
            }}            
        )            

        // collecting cancelled product amount for adding in the wallet
        let amount = 0;
        const order = await Order.findById(orderID).populate('usedCouponID');
        console.log(order);
        const cancelledProduct = order.orderedProducts.find(function(product){
            return product._id == docID
        });

        if(order.couponAdded){
            const discountPrice = (cancelledProduct.totalPrice / order.productTotal) * order.usedCouponID.deductedAmount;
            amount += cancelledProduct.totalPrice - discountPrice;
        }
        else{
            amount = cancelledProduct.totalPrice;
        }   
        console.log("amount : ",amount);
        const wallet = await Wallet.findOne({userID:req.session.userID})
        console.log(wallet);
        if(wallet){ //this means, the wallet is already added
            const obj = {
                amount,
                date:new Date,
                source:"Refunded",
                transactionType:"credited"
            }
            const walletAmount = wallet.walletAmount + amount
            await Wallet.updateOne({_id:wallet._id},{
                $push:{creditedDetail:obj},
                $set:{walletAmount:walletAmount}
            })
            console.log("product cancelled and amount added to wallet");
        }
        else{
            let creditedDetail = [];
            const details = {
                amount,
                date:new Date,
                source:"Refunded",
                transactionType:"credited"
            }
            creditedDetail.push(details);
            const newWallet = await Wallet.create({
                userID,
                creditedDetail
            });

            const walletAmount = newWallet.walletAmount + amount
            await Wallet.updateOne({_id:newWallet._id},{$set:{walletAmount}})
            console.log("product cancelled and amount added to wallet");
        }
        res.status(200).json({sucess:"order cancelled"});
    }
    catch(error){
        console.log(error,"error when cancelling order from user side");
        res.status(500).json({error:'cancellation failed'})
    }
}