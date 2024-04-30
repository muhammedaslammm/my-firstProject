const Order = require("./../models/orderModel");
const Cart = require("./../models/cartModel");
const Product = require("./../models/productModel");
const User = require("../models/userModel");
const Address = require("./../models/addressModel");
const Wallet = require("./../models/walletModel")
const {ObjectId} = require("mongodb");
const generateOrderID = require('./../operations/generateOrderID');


// placing order 'cash on delivery'
exports.placeOrder = async function(req,res){
    try{
        const {address,cartID,payment,orderTotal} = req.body;
        const userID = req.session.userID;
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
        const user = await User.findById(req.session.userID);
             
        const orderedProducts = [];
        const date = new Date();
        const newDate = date.setDate(date.getDate() + 3)
        const deliveryDate = new Date(newDate)
        carts.forEach(function(cart){
            const moasOrderID = generateOrderID()
            let totalPrice = 0;
            if(cart.productID.productOffer){
                totalPrice += cart.productID.productOffer.sellingPrice * cart.quantity
            }
            else{
                totalPrice += cart.productID.sellingPrice * cart.quantity
            }
            const productDetails = {
                productID:cart.productID._id,
                moasOrderID,
                deliveryDate,                
                quantity:cart.quantity,
                size:cart.size,                
                totalPrice
            }
            orderedProducts.push(productDetails);
        })
        
        // ordering data
        const order = await Order.create({
            userID,
            username:user.username,
            orderedProducts,
            orderedDate:new Date(),
            address,
            orderTotal,
            paymentMethod:payment
        })
        const orderID = order._id
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
        res.redirect(`/order-response-page?order_id=${orderID}`);
        console.log("order placed!");
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
        const orders = await Order.aggregate([
            {$match:{_id:new ObjectId(orderID)}},
            {$unwind:'$orderedProducts'}, 
            {$project:{
                orderedProduct:'$orderedProducts'
            }}           
        ])
        if(!orders){
            res.redirect("/cart-page")
        }
        const onProgress = orders.every(function(order){
            return order.hasOwnProperty('orderedProduct') && order.orderedProduct.orderStatus === 'on progress'
        })
        if(onProgress){
            const order = await Order.findOne({_id:orderID}).populate('orderedProducts.productID')   
            console.log(order);
            const products = order.orderedProducts;
            const address = await Address.findById(order.address);
            
            res.render("orderResponsePage",{products,address,userID,order})
        }
        else{
            console.log("order status not all in 'on progress'");
        }        
    }
    catch(error){
        console.log("error in order response page",error);
    }
}



// order page
exports.orderPage = async function(req,res){
    try{
        const userID = req.session.userID
        const orders = await Order.find({userID}).populate('orderedProducts.productID').sort({orderedDate:-1})
        // console.log(orders);
        const statuses = ["on progress","shipped","delivered"]
        res.render("orderPage",{orders,statuses,userID});        
    }
    catch(error){
        console.log("somm error in order page",error);
    }
}

// view ordered product
exports.viewOrderedProduct = async function(req,res){
    const orderID = req.params.order_id;
    const productID = req.params.product_id;
    const userID = req.session.userID
    try{
        const order = await Order.findById(orderID).populate('orderedProducts.productID')
        const product = order.orderedProducts.find(function(product){
            return product._id.toString() === productID;
        })
        
        const address = await Address.findById(order.address);
        const statuses = ["on progress","shipped","pending"]
        res.render("orderedProduct",{address,product,order,statuses,userID});
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
        const userID = req.session.userID  ;

        const updateStatus = await Order.updateOne(
            {_id:orderID,'orderedProducts._id':docID},
            {$set:{
                'orderedProducts.$.orderStatus':'cancelled',
                'orderedProducts.$.cancelledDate':cancelledDate,
                'orderedProducts.$.deliveryDate':null,                
            }}            
        ) 

        const order = await Order.findById(orderID);
        const cancelledProduct = order.orderedProducts.find(function(product){
            return product._id == docID
        })
        const wallet = await Wallet.findOne({})
        if(wallet){ //this means, the wallet is already added
            const obj = {
                amount:cancelledProduct.totalPrice,
                date:new Date,
                source:"Refunded"
            }
            const walletAmount = wallet.walletAmount + cancelledProduct.totalPrice
            await Wallet.updateOne({_id:wallet._id},{
                $push:{creditedDetail:obj},
                $set:{walletAmount:walletAmount}
            })
        }
        else{
            let creditedDetail = [];
            const details = {
                amount:cancelledProduct.totalPrice,
                date:new Date,
                source:"Refunded"
            }
            creditedDetail.push(details);
            const newWallet = await Wallet.create({
                userID,
                creditedDetail
            });

            const walletAmount = newWallet.walletAmount + cancelledProduct.totalPrice;
            await Wallet.updateOne({_id:newWallet._id},{$set:{walletAmount}})
        }
        console.log("product cancelled and amount added to wallet");                
        
        console.log("order cancelled from client side");
        res.status(200).json({sucess:"order cancelled"});

    }
    catch(error){
        console.log(error,"error when cancelling order from user side");
        res.status(500).json({error:'cancellation failed'})
    }
}