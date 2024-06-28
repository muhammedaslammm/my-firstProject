const express = require("express");
const app = express();
const sharp = require("sharp")
const fs = require("fs");
const path = require("path");
const validator = require("validator");
const User = require("./../models/userModel");
const Category = require("./../models/categoryModel");
const Product = require("./../models/productModel");
const Order = require("./../models/orderModel");
const Cart = require("./../models/cartModel");
const Banner = require("./../models/bannerModel");
const CategoryOffer = require("../models/categoryOfferModel");
const ProductOffer = require("../models/productOfferModel");
const Coupon = require('./../models/couponModel');
const UsedCoupon = require('./../models/usedCouponModel');
const usedCouponModel = require("./../models/usedCouponModel");
const referralReward = require("./../models/referralRewardModel");
const Excel = require("exceljs");
const {jsPDF} = require('jspdf');
const Notification = require('./../models/notification');
const Wallet = require("./../models/walletModel");
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose')
require('jspdf-autotable');


// admin login page
exports.adminLoginPage = function(req,res){ 
    if(req.session.adminID){
        res.redirect("/admin/adminHome")
    }   
    else{
        res.render("adminLoginPage")
    }    
}


// admin login submission
exports.adminLoginPage_post = function(req,res,next){
    try{
        const {username,password} = req.body;
        const errors = {}
        for(let key in req.body){
            if(validator.isEmpty(req.body[key])){
                errors[key] = "Field Required"
            }
        }
        if(Object.keys(errors).length > 0){
            res.render("adminLoginPage",{errors,userData:req.body})
        }
        else{
            const admin = {
                username:"admin",
                password:"1234"
            }
            if(username === admin.username && password === admin.password){
                req.session.adminID = "a2d5m8i7n"
                res.redirect("/admin/adminHome");
            }
            else{
                errors.login = "invalid username or password"
                res.render("adminLoginPage",{errors,userData:req.body});
            }
        }
    }
    catch(error){
        next(error)
    }
    
}

// admin dahsboard
exports.adminHomepage= function(req,res){
    res.render("adminDashboard");
}

// get sales data for graph in dashboard
exports.getSalesData = async function(req,res){    
    try{
        const filter = req.query.filter;
        let query = {}        
        if(filter === 'week'){
            let currentDate = new Date();
            let currentDay = currentDate.getDay();
            const daysToMonday = currentDay === 0 ? 7 - 1 : currentDay - 1;

            const currentWeekStartDate = new Date(currentDate);
            currentWeekStartDate.setDate(currentDate.getDate() - daysToMonday);

            const currentWeekEndDate = new Date(currentWeekStartDate);
            currentWeekEndDate.setDate(currentWeekStartDate.getDate() + 6)
            
            query.orderedDate = {$gte:currentWeekStartDate,$lte:currentWeekEndDate}
        }
        else if(filter === 'month'){
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0,0,0,0);

            const monthEnd = new Date();
            monthEnd.setMonth(monthStart.getMonth() + 1);
            monthEnd.setDate(1);
            monthEnd.setHours(0,0,0,0);

            query.orderedDate = {$gte:monthStart, $lte:monthEnd}
        }
        else if(filter === 'year'){
            const yearStart = new Date();
            yearStart.setDate(1);
            yearStart.setMonth(1);
            yearStart.setHours(0,0,0,0);

            const yearEnd = new Date(yearStart);
            yearEnd.setDate(31);
            yearEnd.setMonth(11);
            yearEnd.setHours(23,59,59,999);

            query.orderedDate = {$gte:yearStart,$lte:yearEnd}
        }
        const orders = await Order.find(query).populate('orderedProducts.productID');
        let labels = ['on progress','delivered','returned','cencelled','pendings'];
        let totalOrders = 0,
            totalOrderedProducts = 0,
            totalUsers = 0,
            onProgressItems = 0,
            deliveredItems = 0,
            cancelledItems = 0,
            returnedItems = 0,
            pendingItems = 0;

        let userID = ''
        let brands = {};
        let categories = {}
        let productNames = {}
        orders.forEach(function(order){
            totalOrders += 1;
            if(JSON.stringify(order.userID) != JSON.stringify(userID)){
                totalUsers += 1;
                userID = order.userID;
            }
            order.orderedProducts.forEach(function(product){
                totalOrderedProducts += 1;

                switch(product.orderStatus){
                    case 'on progress':
                        onProgressItems += 1;
                        break;
                    case 'delivered':
                        deliveredItems += 1;
                        break;
                    case 'cancelled':
                        cancelledItems += 1;
                        break;
                    case 'returned':
                        returnedItems += 1;
                        break;
                    case 'pending':
                        pendingItems += 1;
                        break;
                    default:
                        break;
                }

                // best selling brand
                const orderStatuses = ['cancelled','returned','pending'];
                
                if(!orderStatuses.includes(product.orderStatus)){
                    if(brands[product.productID.brand]){
                        brands[product.productID.brand] = brands[product.productID.brand] + 1;
                    }
                    else{
                        brands[product.productID.brand] = 1;
                    }
                }
                
                // best selling category
                if(!orderStatuses.includes(product.orderStatus)){
                    if(categories[product.productID.category]){
                        categories[product.productID.category] = categories[product.productID.category] + 1;
                    }
                    else{
                        categories[product.productID.category] = 1;
                    }
                }

                // best selling product
                if(!orderStatuses.includes(product.orderStatus)){
                    const productName = product.productID._id;
                    if(productNames[productName]){
                        productNames[productName] += 1;
                    }
                    else{
                        productNames[productName] = 1;                        
                    }
                }
            }); 
        })

        // finding best selling brand
        let bestSellingBrand = null;
        let brandCount = -Infinity;
        for(let key in brands){
            if(brands[key] > brandCount){
                bestSellingBrand = key;
                brandCount = brands[key];
            }
        }

        // finding the best selling category
        let bestSellingCategory = null;
        let categoryCount = 0;
        for(let category in categories){
            if(categories[category] > categoryCount){
                categoryCount = categories[category];
                bestSellingCategory = category;
            }
        }

        // finging best selling product        
        let bestSellingProductID;
        let productRank = 0;
        for(let productID in productNames){
            if(productNames[productID] > productRank){
                bestSellingProductID = productID;
                productRank = productNames[productID];
            }
        }

        const productID = new ObjectId(bestSellingProductID);
        const bestSellingProductDoc = await Product.findOne({_id:productID}) ?? ''
        const bestSellingProduct = `${bestSellingProductDoc.brand} Men's ${bestSellingProductDoc.fit} ${bestSellingProductDoc.productType}`;
        const bestSellingProductImage = bestSellingProductDoc.images[0];
        
        
        let graphData = []
        graphData.push(onProgressItems,deliveredItems,returnedItems,cancelledItems,pendingItems);
        res.status(200).json({
            labels,
            graphData,
            totalOrders,
            totalOrderedProducts,
            totalUsers,
            bestSellingBrand,
            brandCount,
            bestSellingCategory,
            bestSellingProduct,
            bestSellingProductImage,
            categoryCount
        })


    }
    catch(error){
        console.log("error",error);
        res.status(500).json({error:'error'});
    }
    
}


// admin user management page
exports.userManagement = async function(req,res,next){
    try{
        const users = await User.find();
        res.render("adminUser",{users});
    }
    catch(error){
        next(error)        
    }
}

// blocking and unblocking user
exports.blockUser = async function(req,res,next){
    const userID = req.params.id;
    try{
        const update = await User.updateOne({_id:userID},{$set:{isBlocked:true}});
        res.json({status:"Blocked",button:"Unblock"})
    }
    catch(error){
        next(error)
    }
}

exports.unblockUser = async function(req,res,next){
    try{
        const userID = req.params.id;
        const update = await User.findByIdAndUpdate(userID,{isBlocked:false});
        res.json({status:"Active",button:"Block"})
    }
    catch(error){
        next(error)
    }
}


// admin product category page
exports.adminCategoryPage = async function(req,res,next){
    try{
        const categories = await Category.find({deletedAt:null});
        res.render("adminCategory",{categories});
    }
    catch(error){
        next(error)
    }
    
}

// add new category
exports.addNewCategory = async function(req,res,next){
    const categoryData = req.body;
    const errors = {}

    try{
        const categories = await Category.find({deletedAt:null});
        const query = {category:{$regex:categoryData.category,$options:"i"}}
        const matchingCategory = await Category.findOne(query);
        if(validator.isEmpty(req.body.category)){
            errors.category = "enter valid category"
        }
        else if(matchingCategory){
            errors.category = "category existing"
        }

        if(Object.keys(errors).length > 0){
            res.render("adminCategory",{categories,errors,categoryData});
        }else{
            try{
                const words = categoryData.category.split(" ");
                const userCategory = words.map(function(word){
                    return word[0].toUpperCase() + word.slice(1);
                }).join(" ");
                await Category.create({
                    category:userCategory
                })
                const categories = await Category.find({deletedAt:null});
                console.log("category created");
                res.render("adminCategory",{categories})
            }
            catch(error){
                console.log("couldn't add new category",error);
            }
        }
        
    }
    catch(error){
        next(error)
    }
}

// edit category page
exports.editCategory = async function(req,res,next){
    const categoryID = req.params.id;
    try{
        const currentCategory = await Category.findById(categoryID);
        res.render("updateCategory",{currentCategory});
    }
    catch(error){
        next(error)
    }
}

// edit category
exports.updateCategory_post = async function(req,res){
        const categoryID = req.params.id;
        const errors = {};
        try{
            const currentCategory = await Category.findById(categoryID);
            const matchingCategory = await Category.findOne({category:{$regex:req.body.category,$options:'i'}});
            if(matchingCategory){
                errors.update = "category existing";                
            }
            if(Object.keys(errors).length > 0){
                res.render("updateCategory",{errors,searched:req.body,currentCategory})
            }

            else{   
                const words = req.body.category.split(" ");
                const newCategory = words.map(function(word){
                    return word[0].toUpperCase() + word.slice(1);
                }).join(" ");             
                const update_category = await Category.updateOne({_id:categoryID},{$set:{category:newCategory}});
                console.log("category edited");
                res.redirect("/admin/category")
            }
        }
        catch(error){
            console.log("category updation failed");
            res.redirect("/admin/category",error)
        }      
} 

// delete category
exports.deleteCategory = async function(req,res,next){
    const categoryID = req.params.id;
    try{
        await Category.findByIdAndUpdate(categoryID,{deletedAt:new Date});
        console.log("category soft deleted");
        res.redirect("/admin/category");
    }
    catch(error){
        next(error)
    }
}

// admin product page
exports.adminProductPage = async function(req,res,next){

    const productPerPage = 5;
    const page = parseInt(req.query.page) || 1
    try{
        const products = await Product.find({deletedAt:null})  
        .sort({date:-1})       
        .skip((page-1)*productPerPage)        
        .limit(productPerPage)
        .populate('productOffer')

        const currentPage = page;
        const totalProducts = await Product.countDocuments()
        const totalPages = Math.ceil(totalProducts/productPerPage);        
        
        res.render("adminProductPage",{products,currentPage,totalPages})
    }
    catch(error){
        next(error)
    }
}

// add new product page
exports.addNewProduct_page = async function(req,res,next){
    try{
        const categories = await Category.find({deletedAt:null});
        console.log(categories);
        res.render("addNewProduct",{categories})
    }
    catch(error){
        next(error)
    }
}

// crop image
exports.cropImage = async function(req,res){
    try{       
        if(req.file){
            let image = sharp(req.file.buffer);
            image =  image.resize(600,800,{fit:'cover'});

            const resizedImage = await image.toBuffer();
            const cropData = {
                left:0,
                top:0,
                width:600,
                height:800
            }
            const croppedBuffer = await sharp(resizedImage).extract(cropData).toBuffer();
            
            res.writeHead(200,{
                'Content-Type':'image/jpeg',
                'Content-Length':croppedBuffer.length
            })
            res.end(croppedBuffer);
        }
        else if(req.files){
            console.log(req.files);
        }
        
    }
    catch(error){
        console.log("error when cropping",error);
        res.status(404).send('Error when cropping img')
    }
}


// add new porduct to db
exports.addNewProduct = async function(req,res){    
    const newProduct = req.body;
    console.log(newProduct);
    console.log(req.files); 

    const images = req.files.map(function(file){
        return `/images/${file.filename}`
    })   
    
    try{
        const discount = Math.round(((req.body.actualPrice-req.body.sellingPrice)/req.body.actualPrice)*100);

        const uploadProduct = await Product.create({
            images,
            sleeve:req.body.sleeve,
            wash:req.body.wash,
            fit:req.body.fit,
            color:req.body.color,
            pattern:req.body.pattern,
            fabric:req.body.fabric,
            brand:req.body.brand,
            productType:req.body.productType,
            extra_small:req.body.extra_small,
            small:req.body.small,
            medium:req.body.medium,
            large:req.body.large,
            extra_large:req.body.extra_small,
            extra_extra_large:req.body.extra_extra_large,
            actualPrice:req.body.actualPrice,
            sellingPrice:req.body.sellingPrice,
            category:req.body.category,
            discount,
            status:req.body.status,                
            date:req.body.date
        })

        console.log("product uploaded successful");
        res.status(200).send("product uploaded");
        
    }
    catch(error){
        console.log("sever failuer",error);
        res.status(404).send('Product Upload failed')
    }
       
}



// delete product
exports.deleteProduct = async function(req,res){
    const productID = req.params.id;
    try{
        const deletedProduct = await Order.findOne({$and:[{'orderedProducts.productID':productID},{$or:[{'orderedProducts.orderStatus':'pending'},{'orderedProducts.orderStatus':'on progress'}]}]});
        console.log('already ordered : ',deletedProduct);
        if(!deletedProduct){
            await Product.findByIdAndUpdate(productID,{deletedAt:new Date});        
            console.log("product deleted");
            res.json({message:'product deleted'});
        } 
        else{
            console.log('cannot delete this product');
            res.json({message:'deletion failed'})
        }       
    }
    catch(error){
        console.log("server error",error);
        res.json({error:'product deletion failed'})
    }
}

//update page 
exports.updateProductPage = async function(req,res){
    try{
        const productID = req.params.id;
        const product = await Product.findById(productID);
        const categories = await Category.find({deletedAt:null})  ;
        const imgURLs = {};
        for(let i=0; i<product.images.length; i++){
            imgURLs[`img${i+1}`] = product.images[i]
        }     
        res.render("updateProduct",{product,categories,imgURLs});
    }
    catch(error){
        console.log("server error",error);
        res.redirect("/admin/products?message='server failure'")
    }
}

// product finally updating
exports.updateProduct = async function(req,res){
    
    const productUpdate = req.body;
    const categories = await Category.find()
    const productID = req.params.id;
    const updateImages = req.files
    const productFromDB = await Product.findById(productID);
    const productImageURL = productFromDB.images;
    const imageURLs = [];
    console.log(req.files);
    const properties = ["image1","image2","image3"];
    const objectKeys = Object.keys(req.files);
    let jvalue = 0
    for(let i=0; i<properties.length; i++){
        for(let j=jvalue; j<=objectKeys.length; j++){
            if(properties[i] === objectKeys[j]){
                const objectKey = objectKeys[j]
                imageURLs.push(`/images/${updateImages[objectKey][0].filename}`)
                jvalue++;
                break;
            }
            else{
                imageURLs.push(`${productImageURL[i]}`);
                break;
            }
        }
    }
    try{         
        const discount = Math.round(((req.body.actualPrice - req.body.sellingPrice)/req.body.actualPrice)*100) 
        const productUpdate = await Product.updateOne({_id:productID},{$set:{
            images:imageURLs,
            sleeve:req.body.sleeve,
            wash:req.body.wash,
            fit:req.body.fit,
            color:req.body.color,
            pattern:req.body.pattern,
            fabric:req.body.fabric,
            brand:req.body.brand,
            productType:req.body.productType,
            extra_small:req.body.extra_small,
            small:req.body.small,
            medium:req.body.medium,
            large:req.body.large,
            extra_large:req.body.extra_large,
            extra_extra_large:req.body.extra_extra_large,
            actualPrice:req.body.actualPrice,
            sellingPrice:req.body.sellingPrice,
            category:req.body.category,
            discount,
            status:req.body.status,                
            date:req.body.date
        }});

        console.log("product Updated");
        res.status(200).send("product updated")
    }
    catch(error){
        console.log("server error",error);
        res.status(500).send("failed to update the product")
    }
           

}

// product offer page
exports.productOfferPage = async function(req,res,next){
    const productID = req.query.productID;
    try{
        const product = await Product.findById(productID);
        res.render('productOffer',{productID,product})
    }
    catch(error){
        next(error)
    }
    
}

// add the submitted product offer
exports.addProductOffer = async function(req,res){
    const productID = req.query.productID;
    const {offer,startDate,endDate} = req.body;

    try{
        const product = await Product.findById(productID);
        const discountedAmount = product.actualPrice*(offer/100);
        const sellingPrice = product.actualPrice - discountedAmount;
        const newOffer = await ProductOffer.create({
            offer,  
            startDate,
            endDate,
            sellingPrice,
            product:productID
        })

        // add product offer reference in the product model
        await Product.updateOne({_id:productID},{$set:{productOffer:newOffer._id}});

        console.log("offer added");
        res.redirect("/admin/products")
    }
    catch(error){
        console.log("error when adding offer to the product",error);;
        res.redirect("/admin/products");
    }
}

// edit product offer page
exports.editProductOfferPage = async function(req,res){
    const productID = req.query.productID;
    try{
        const product = await Product.findById(productID).populate('productOffer');
        res.render('productOffer',{productID,product})
    }
    catch(error){
        console.log("error when rendering edit offer page for the product",error);
        res.redirect("/admin/products")
    }
}

// edit the product offer
exports.editProductOffer = async function(req,res){
    const productID = req.query.productID;
    const {offer,startDate,endDate} = req.body;
    console.log(offer);
    try{
        const product = await Product.findById(productID);
        const sellingPrice = Math.floor(Number(product.actualPrice) - Number(product.actualPrice) * (offer/100));
        const updateProductOffer = await ProductOffer.updateOne({product:productID},{$set:{
            offer,
            startDate,
            endDate,
            sellingPrice
        }});
        res.redirect('/admin/products')
    }
    catch(error){
        console.log("error when editing the product offer",error);
        res.redirect('/admin/products')
    }
}

// delete the product offer
exports.deleteProductOffer = async function(req,res){
    const offerID = req.query.offerID;
    try{
        const productOffer = await ProductOffer.findById(offerID);
        const productID = productOffer.product;

        // delete the offer
        await ProductOffer.findByIdAndDelete(offerID);
        await Product.findByIdAndUpdate(productID,{productOffer:null});
        res.status(200).json({success:'product offer deleted'});

    }
    catch(error){
        console.log("error when deleteing the product offer",error);
        res.status(500).json({error:"failed to delete the product offer"});
    }
}

// admin order page
exports.orderPage = async function(req,res,next){
    const userID = req.session.userID; 
    const currentPage = parseInt(req.query.currentPage) || 1;
    const pageLimit = 6;
    const skipContent = (currentPage - 1) * pageLimit;
    try{         
        const orders = await Order.find()
            .populate('orderedProducts.productID')
            .populate('address')
            .sort({orderedDate:-1})
            .skip(skipContent)
            .limit(pageLimit)
        
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / pageLimit)
        res.render("adminOrderPage",{orders,currentPage,totalPages});
    }
    catch(error){
        next(error)
    }
}

// handle user request
exports.handleUserRequest = async function(req,res){
    try{
        const {orderID,docID,response} = req.body;
        const adminResponse = response === 'request rejected' ? 'delivered' : response
        await Order.updateOne(
            {_id:orderID,'orderedProducts._id':docID},
            {$set:{'orderedProducts.$.orderStatus':adminResponse}}
        )
        const notifications = await Notification.findOne({userID:req.session.userID});
        if(notifications){
            let message = [];
            let count = notifications.count + 1;
            const text = response === 
            'request rejected' ? 
            'Your request for the product return is rejected by MOASWeb. Better try next time.' :
            'Your request for the product return is approved by the MOASWeb. The product will soon collected by our team from you.';
            const obj = {
                text,                
            }
            message.push(obj);
            await Notification.updateOne({userID:req.session.userID},
                {$push:{message}},
                {$set:count}
            )            
        }
        else{
            const text = response === 
            'request rejected' ?
            'Your request for the product return is rejected by MOASWeb. Better try next time.' :
            'Your request for the product return is approved by the MOASWeb. The product will soon collected by our team from you.';
            let message = []
            const obj = {
                text
            }
            message.push(obj)
            const newNotification = await Notification.create({
                userID:req.session.userID,
                count:0,
                message
            })
        }
        res.status(200).json({response});
    }
    catch(error){
        console.log("error",error);
        res.status(500).json({error:'error'});
    }
}

// handle order status
exports.changeOrderStatus = async function(req,res){
    try{
        const userID = req.session.userID
        const {orderID,productDocID,status} = req.body;
        
        if(status === 'delivered'){                       
            await Order.updateOne(
                {_id:orderID,'orderedProducts._id':productDocID},
                {$set:{
                    'orderedProducts.$.deliveredDate':new Date(),
                    'orderedProducts.$.cancelledDate':null,
                    'orderedProducts.$.deliveryDate':null,
                    'orderedProducts.$.returnedDate':null,
                    'orderedProducts.$.orderStatus':'delivered'
                }}
            );  
            res.status(200).json({success:'success',status});
        }
        else if(status === 'cancelled'){
            await Order.updateOne(
                {_id:orderID,'orderedProducts._id':productDocID},
                {$set:{
                    'orderedProducts.$.cancelledDate':new Date(),
                    'orderedProducts.$.deliveredDate':null,
                    'orderedProducts.$.deliveryDate':null,
                    'orderedProducts.$.returnedDate':null,
                    'orderedProducts.$.orderStatus':'cancelled'
                }
            });
            res.status(200).json({success:'success',status})

        }
        else if(status === 'on progress'){
            const date = new Date();
            const deliveryDate = date.setDate(date.getDate() + 3);
            await Order.updateOne(
                {_id:orderID,'orderedProducts._id':productDocID},
                {$set:{
                    'orderedProducts.$.deliveryDate':deliveryDate,
                    'orderedProducts.$.cancelledDate':null,
                    'orderedProducts.$.deliveredDate':null,
                    'orderedProducts.$.returnedDate':null,
                    'orderedProducts.$.orderStatus':'on progress'
                }}
            )
            res.status(200).json({success:'success',status});
        }
        else if(status === 'returned'){
            await Order.updateOne(
                {_id:orderID,'orderedProducts._id':productDocID},
                {$set:{
                    'orderedProducts.$.orderStatus':'returned',
                    'orderedProducts.$.deliveredDate':null,
                    'orderedProducts.$.cancelledDate':null,
                    'orderedProducts.$.deliveryDate':null,
                    'orderedProducts.$.returnedDate':new Date()
                }}
            )
            let amount = 0;
            const order = await Order.findById(orderID).populate('usedCouponID');
            const returnedProduct = order.orderedProducts.find(function(product){
                return JSON.stringify(product._id) === JSON.stringify(productDocID);
            })
            console.log('returned product',returnedProduct);
            if(order.couponAdded){
                const discountPrice = (returnedProduct.totalPrice / order.productTotal) * order.usedCouponID.deductedAmount;
                amount = Math.round(returnedProduct.totalPrice - discountPrice);
                console.log('returned product amount :',amount);
            }
            else{
                amount = returnedProduct.totalPrice;
                console.log('returned product amount: ',amount);
            }
            const wallet = await Wallet.findOne({userID:req.session.userID});
            if(wallet){
                const object = {
                    amount,
                    transactionType:'credited',
                    source:'Product Returned',
                    date:new Date()
                }
                const walletAmount = wallet.walletAmount + amount;
                await Wallet.updateOne({userID:req.session.userID},{
                    $push:{creditedDetail:object},
                    $set:{walletAmount}
                })
                console.log('product returned and amount added to wallet.');
            }
            else{
                const walletAmount = amount;
                let creditedDetail = [];
                const object = {
                  amount,
                  transactionType:'credited',
                  source:'Product Returned',
                  date:new Date()
                }
                creditedDetail.push(object);
                const newWallet = await Wallet.create({
                    userID:req.session.userID,
                    walletAmount,
                    creditedDetail
                })
                console.log('product returned and amount added to the wallet');
            }
            res.status(200).json({success:'success',status})
        }
        

    }
    catch(error){
        console.log(error,"error when changing status");
        res.json(500).json({error:"error"})
    }
}

// bannerpage
exports.bannerPage = async function(req,res,next){
    try{
        const banners = await Banner.find({deletedAt:null});
        res.render("adminBanner",{banners})
    }
    catch(error){
        next(error)
    }
}

// UPLOAD banner page
exports.uploadBannerPage = function(req,res){
    res.render("addBanner")
}

//upload banner
exports.uploadBanner = async function(req,res,next){
    try{
        console.log(req.file);
        if(req.file === undefined){
            res.redirect("/admin/adminBanner")
        }
        const bannerURL = `/wallpapers/${req.file.filename}`;
        const newBanner = await Banner.create({
            image:bannerURL,
            title:req.body.title
        })
        console.log("banner successfully added");
        res.redirect("/admin/adminBanner")
    }
    catch(error){
        next(error)
    }
}

// delete banner
exports.deleteBanner = async function(req,res,next){
    try{
        const bannerID = req.params.id;
        const softDelete = await Banner.updateOne({_id:bannerID},{$set:{deletedAt:new Date}});
        console.log("banner deleted");
        const banners = await Banner.find({default:null});
        res.json({message:"deleted",banners});
    }
    catch(error){
        next(error)
    }
}


// page to edit banner
exports.editBannerPage = async function(req,res,next){
    try{
        const bannerID = req.params.id;
        const banner = await Banner.findById(bannerID)
        res.render("editBanner",{banner})
    }
    catch(error){
        next(error)
    }
}

// edit banner post
exports.editBanner = async function(req,res,next){
    try{
        const bannerID = req.params.id;  
        console.log(req.file);      
        if(req.file === undefined){
            await Banner.updateOne({_id:bannerID},{$set:{title:req.body.title}});
            console.log("banner title edited");
            res.redirect("/admin/adminBanner");            
        }
        else{
            const bannerURL = `/wallpapers/${req.file.filename}`;
            console.log(req.body.imageURL);
            const imageURL = req.body.imageURL.split("s/");
            const existingImage = path.join(__dirname,'public','wallpaper',imageURL[1])
            fs.unlink(existingImage, function(error){
                if(error){
                    console.log("error when deleting the existing banner image");
                }
                console.log("existing banner successfully deleted..");                
            });
            const updateBanner = await Banner.updateOne({_id:bannerID},{$set:{image:bannerURL,title:req.body.title}});
            console.log("banner updated");
            res.redirect("/admin/adminBanner")
        }        
    }
    catch(error){
        next(error)
    }
}

// admin coupon page
exports.adminCouponPage = async function(req,res,next){
    try{
        const coupons = await Coupon.find();
        res.render("adminCoupon",{coupons})
    }
    catch(error){
        next(error)       
    }
}

// admin add coupon page
exports.addCouponPage = async function(req,res,next){
    try{
        const coupon = ''
        res.render('addEditCoupon',{coupon})
    }
    catch(error){
        next(error)
    }    
} 

// add the coupon
exports.addCoupon = async function(req,res){
    const {coupon_head,couponCode,minimumAmount,offerAmount} = req.body;
    const startDate = new Date(req.body.startDate);
    startDate.setUTCHours(0,0,0,0);
    const endDate = new Date(req.body.endDate);
    endDate.setHours(23,59,59,999);
    try{
        const newCoupon = await Coupon.create({
            coupon_head,
            couponCode,
            minimumAmount,
            offerAmount,
            startDate,
            endDate
        })
        console.log("coupon added");
        res.redirect('/admin/coupon')
    }
    catch(error){
        console.log("error when adding coupon",error);
        res.redirect("/admin/coupon")
    }
}

// admin edit coupon page
exports.editCouponPage = async function(req,res){
    const couponID = req.query.couponID;
    try{
        const coupon = await Coupon.findById(couponID);
        res.render("addEditCoupon",{coupon});
    }
    catch(error){
        console.log("error when rendering edit coupon page",error);
        res.redirect("/admin/coupon")
    }
}

// admin edit the coupon
exports.editCoupon = async function(req,res){
    const couponID = req.query.couponID;
    const {coupon_head,couponCode,minimumAmount,offerAmount} = req.body;
    const startDate = new Date(req.body.startDate);
    startDate.setUTCHours(0,0,0,0);
    const endDate = new Date(req.body.endDate);
    endDate.setHours(23,59,59,999);
    try{
        await Coupon.updateOne({_id:couponID},{$set:{
            coupon_head,
            couponCode,
            minimumAmount,
            offerAmount,
            startDate,
            endDate
        }});
        console.log("coupon edited");
        res.redirect('/admin/coupon')
    }
    catch(error){
        console.log("error when editing the offer",error);
        console.log("coupon edit failed");
        res.redirect('/admin/coupon')
    }
}

// check coupon
exports.checkCouponCode = async function(req,res){
    const couponCode = req.query.code;
    try{
        const matchingCoupon = await Coupon.findOne({couponCode});
        if(matchingCoupon){
            res.status(200).json({result:'matching'})
        }
        else{
            res.status(200).json({result:'not matching'})
        }
    }
    catch(error){
        console.log('error',error);
        res.status(500).json({error:'error'})
    }
}

// admin delete coupon
exports.deleteCoupon = async function(req,res){
    const couponID = req.query.couponID;
    try{
        await Coupon.findByIdAndDelete(couponID);
        res.status(200).json({success:'deleted Success'})
    }
    catch(error){
        console.log("failed to delete the coupon");
        res.status(500).json({error:'deletion failed'});
    }
}


// referral page
exports.referralReward = async function(req,res,next){
    try{
        const rewards = await referralReward.findOne();
        res.render("adminReward",{rewards});
    }
    catch(error){
        next(error)
    }
}

// add - edit referral reward page
exports.referralRewardPage = async function(req,res,next){
    const action = req.params.action;
    try{
        if(action === "add"){
            const reward = ""
            res.render("addEditReferral",{title:'Add',reward});
        }
    }catch(error){
        next(error)
    }
}

// add - edit referal reward
exports.addEditReward = async function(req,res){
    const action = req.params.action;
    const {referrorNewReward, refereeNewReward} = req.body;
    try{
        if(action === 'add'){
            const newReward = await referralReward.create({
                referrorNewReward,
                refereeNewReward,
                updateDate:new Date
            })
            res.redirect("/admin/referralManagement")
        }
    }
    catch(error){
        console.log("error",error);
        res.redirect("/admin/referralManagement")
    }
}

// admin sales report page
exports.salesReportPage = async function(req,res,next){
    try{
        const sortValue = req.query.sort;
        const filter = {};
        if(sortValue === "today"){
            const currentDate = new Date();
            currentDate.setHours(0,0,0,0);
            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23,59,59,999);

            // query for current date
            filter['orderedProducts.deliveredDate'] = {$gte:currentDate,$lte:endOfDay};
        }
        else if(sortValue === "lastWeek"){
            let currentDate = new Date();
            let currentDay = currentDate.getDay();
            const daysToMonday = currentDay === 0 ? 7 - 1 : currentDay - 1;

            const currentWeekStartDate = new Date(currentDate);
            currentWeekStartDate.setDate(currentDate.getDate() - daysToMonday);

            const currentWeekEndDate = new Date(currentWeekStartDate);
            currentWeekEndDate.setDate(currentWeekStartDate.getDate() + 6)

            // querying for last week
            filter['orderedProducts.deliveredDate'] = {$gte:currentWeekStartDate,$lte:currentWeekEndDate}
        }
        else if(sortValue === "lastMonth"){
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);    //date seted for 1st day
            currentMonthStart.setHours(0,0,0,0);

            const currentMonthEnd = new Date(currentMonthStart);
            currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
            currentMonthEnd.setDate(0);
            currentMonthEnd.setHours(23,59,59,999);

            filter['orderedProducts.deliveredDate'] = {$gte:currentMonthStart,$lte:currentMonthEnd}
        }
        else if(sortValue === "lastYear"){
            const currentYearStart = new Date();
            currentYearStart.setDate(1);
            currentYearStart.setMonth(0);
            currentYearStart.setHours(0,0,0,0);

            const currentYearEnd = new Date();
            currentYearEnd.setDate(31);
            currentYearEnd.setMonth(11);
            currentYearEnd.setHours(23,59,59,999);

            filter['orderedProducts.deliveredDate'] = {$gte:currentYearStart,$lte:currentYearEnd};
        }
        else if(sortValue === "all"){

        }
        else if(sortValue){
            let dates = sortValue.split("/");
            const startDate = new Date(dates[0]);
            startDate.getHours(0,0,0,0);
            const endDate = new Date(dates[1]);
            endDate.setHours(23,59,59,999)
            filter['orderedProducts.deliveredDate'] = {$gte:startDate,$lte:endDate}
        }

        // caclulating total products and sales amount 
        const currentPage = Number(req.query.currentPage) || 1;
        console.log('current page: ',currentPage);
        const contentLimit = 4
        const contentToSkip = (currentPage - 1) * contentLimit;
        const orders = await Order.find({...filter,'orderedProducts.orderStatus':'delivered'})
        .populate("orderedProducts.productID")
        .populate("address")
        .sort({orderedDate:-1})
        .skip(contentToSkip)
        .limit(contentLimit)
        
        
        const totalorders = await Order.countDocuments({...filter,'orderedProducts.orderStatus':'delivered'});
        const totalPages = Math.ceil(totalorders / contentLimit);

        // calculate amounts
        let totalSalesAmount = 0;
        let totalProducts = 0;
        let totalOrders = 0;
        let totalUsers = 0;
        let userID = "";
        const filteredOrders = await Order.find({...filter,'orderedProducts.orderStatus':'delivered'})
            .populate('orderedProducts.productID')
            .populate('address')
            .sort({orderedDate:-1})
        filteredOrders.forEach(function(order){            
            if(order){
                // calculating total order and total users     
                const cancelled = order.orderedProducts.every(function(product){
                    return product.orderStatus === 'cancelled';
                })
                if(!cancelled){
                    totalOrders += 1;
                    if(order.userID.toString() !== userID.toString()){
                        totalUsers += 1;
                        userID = order.userID;
                    }                    
                    order.orderedProducts.forEach(function(product){
                        if(product.orderStatus != 'cancelled'){
                            if(product.couponAdded && order.orderedProducts.length === 1){
                                totalSalesAmount += order.orderTotal;
                                totalProducts += 1
                            }
                            else{
                                totalSalesAmount += product.totalPrice
                                totalProducts += 1;
                            }                            
                        }
                    })
                }   
            }            
        })
        res.render("salesReport",{
            totalSalesAmount,
            totalProducts,
            totalUsers,
            totalOrders,
            orders,
            currentPage,
            totalPages,
            filteredOrders,
            contentLimit
        });
    }
    catch(error){
        next(error)
    }
}

// download sales report in excel format
exports.downloadExcel = async function(req,res){
    try{
        const orders = JSON.parse(req.body.orders);
        console.log(orders);
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('MOASweb Sales Report');

        // adding rows        
        worksheet.addRow(["S/N","Buyer","Product","Quantity","Size","Price","Coupon","Order Date","Address","Payment Method"]);
        let sn = 0;
        orders.forEach(function(order){            
            order.orderedProducts.forEach(function(product){
                sn += 1;
                const price = product.couponAdded && order.orderedProducts.length === 1 ? 
                              order.orderTotal : product.totalPrice
                const address = `${order.address.name}, ${order.address.address} ${order.address.district}`;
                const couponData = order.couponAdded ? 'Added' : '-';
                worksheet.addRow([
                    sn,
                    order.username,
                    `${product.productID.brand} ${product.productID.color} ${product.productID.productType}`,
                    product.quantity,
                    product.size,
                    price,
                    couponData,
                    order.orderedDate,
                    address,
                    order.paymentMethod
                ])
            })
        })

        res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition','attchment; filename="moas_salesReport.xlsx"')

        await workbook.xlsx.write(res);
        console.log("excel report created");
        res.end();        
    }
    catch(error){
        console.log(error);
        res.status(500).json({error:"failed"});
    }
    
}

// download sales report as pdf
exports.downloadPdf = async function(req,res){
    try{
        const orders = JSON.parse(req.body.orders);
        const pdf = new jsPDF()

        // setting columns and rows
        const columns = [
            'Sl:no',
            'Buyer',
            'Address',
            'Product',
            'Quantity',
            'Size',
            'Price',
            'Coupon',
            'Order Date',
            'Delivered Date',
            'Payment Method'
        ]
        let index = 0;
        const rows = orders.map(function(order){            
            const rowData = order.orderedProducts.map(function(product){
                const couponData = product.couponAdded ? 'Added' : '-' ;
                const orderedDate = new Date(order.orderedDate);
                const deliveredDate = new Date(product.deliveredDate);
                index += 1;
                return [
                    index,
                    order.username,
                    `${order.address.name}, ${order.address.address} - ${order.address.district}`,
                    `${product.productID.color} Men's ${product.productID.fit} ${product.productID.productType}`,
                    product.quantity,
                    product.size,
                    product.totalPrice,
                    couponData,
                    orderedDate.toDateString(),
                    deliveredDate.toDateString(),
                    order.paymentMethod
                ] 
            })
            return rowData
        })
        let rowStyles = {
            2:{width:30,align:'center'},
            3:{width:50,align:'center'},
            8:{width:30,align:'center'},
            9:{width:30,align:'center'}
        }
        
        pdf.autoTable({
            head:[columns],
            body:rows.flat(),
            rowStyles:rowStyles
        })

        const pdfData = pdf.output('arraybuffer');

        console.log('pdf successfully generated, Alhamdulillah...');
        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition','attachment; filename="moas_salesReport.pdf"');
        res.send(Buffer.from(pdfData))
    }
    catch(error){
        console.log("server error",error);
        res.status(500).json({error:"server error"});
    }
}