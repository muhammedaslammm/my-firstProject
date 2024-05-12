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
const PDF = require('pdfkit')



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
exports.adminLoginPage_post = function(req,res){
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

// admin dahsboard
exports.adminHomepage= function(req,res){
    res.render("adminDashboard");
}


// admin user management page
exports.userManagement = async function(req,res){
    try{
        const users = await User.find();
        res.render("adminUser",{users});
    }
    catch(error){
        console.log("server error");        
    }
}

// blocking and unblocking user
exports.blockUser = async function(req,res){
    const userID = req.params.id;
    try{
        const update = await User.updateOne({_id:userID},{$set:{isBlocked:true}});
        res.json({status:"Blocked",button:"Unblock"})
    }
    catch(error){
        console.log(error,'error when updating user');
    }
}

exports.unblockUser = async function(req,res){
    try{
        const userID = req.params.id;
        const update = await User.findByIdAndUpdate(userID,{isBlocked:false});
        res.json({status:"Active",button:"Block"})
    }
    catch(error){
        console.log(error,"error when updating user");
    }
}


// admin product category page
exports.adminCategoryPage = async function(req,res){
    try{
        const categories = await Category.find({deletedAt:null});
        res.render("adminCategory",{categories});
    }
    catch(error){
        console.log("server error");
    }
    
}

// add new category
exports.addNewCategory = async function(req,res){
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
        console.log("server error",error);
    }
}

// giving offer to category


// edit category page
exports.editCategory = async function(req,res){
    const categoryID = req.params.id;
    try{
        const currentCategory = await Category.findById(categoryID);
        res.render("updateCategory",{currentCategory});
    }
    catch(error){
        console.log("server error");
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
exports.deleteCategory = async function(req,res){
    const categoryID = req.params.id;
    try{
        await Category.findByIdAndUpdate(categoryID,{deletedAt:new Date});
        console.log("category soft deleted");
        res.redirect("/admin/category");
    }
    catch(error){
        console.log("server error",error);
    }
}

// admin product page
exports.adminProductPage = async function(req,res){

    const productPerPage = 5;
    const page = parseInt(req.query.page) || 1
    try{
        const products = await Product.find({deletedAt:null}) 
        .skip((page-1)*productPerPage)
        .limit(productPerPage)
        .populate('productOffer')

        const currentPage = page;
        const totalProducts = await Product.countDocuments()
        const totalPages = Math.ceil(totalProducts/productPerPage);        
        
        res.render("adminProductPage",{products,currentPage,totalPages})
    }
    catch(error){
        console.log("server error",error);
    }
}

// add new product page
exports.addNewProduct_page = async function(req,res){
    try{
        const categories = await Category.find({deletedAt:null});
        console.log(categories);
        res.render("addNewProduct",{categories})
    }
    catch(error){
        console.log("server error",error);
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
        await Product.findByIdAndUpdate(productID,{deletedAt:new Date});
        console.log("product deleted");
        res.json({message:'product deleted'});
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
exports.productOfferPage = async function(req,res){
    const productID = req.query.productID;
    try{
        const product = await Product.findById(productID);
        res.render('productOffer',{productID,product})
    }
    catch(error){
        console.log("error when rendering the product offer page",error);
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
    try{
        const product = await Product.findById(productID);
        const sellingPrice = product.sellingPrice * (offer/100);
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
exports.orderPage = async function(req,res){
    try{
        const userID = req.session.userID;           
        const orders = await Order.find().populate('orderedProducts.productID').populate('address')
        res.render("adminOrderPage",{orders});
    }
    catch(error){
        console.log(error,"error when loading orderpage in admin side");
    }
}


// handle order status
exports.orderStatus = async function(req,res){
    try{
        const userID = req.session.userID
        const {orderID,productID} = req.params;
        const status = req.body.status ;     
        await Order.updateOne({_id:orderID,'orderedProducts.productID':productID},{$set:{'orderedProducts.$.orderStatus':status}})
        
        if(status === 'delivered'){           
            await Order.updateOne(
                {_id:orderID,'orderedProducts._id':productID},
                {$set:{
                    'orderedProducts.$.deliveredDate':new Date(),
                    'orderedProducts.$.cancelledDate':null,
                    'orderedProducts.$.deliveryDate':null,
                    'orderedProducts.$.orderStatus':'delivered'
                }
                });            
        }
        else if(status === 'cancelled'){
            await Order.updateOne(
                {_id:orderID,'orderedProducts._id':productID},
                {$set:{
                    'orderedProducts.$.cancelledDate':new Date(),
                    'orderedProducts.$.deliveredDate':null,
                    'orderedProducts.$.deliveryDate':null,
                    'orderedProducts.$.orderStatus':'cancelled'
                }})
        }
        else if(status === 'on progress'){
            const date = new Date();
            const newDate = date.setDate(date.getDate() + 3)
            const deliveryDate = new Date(newDate)
            await Order.updateOne(
                {_id:orderID,'orderedProducts._id':productID},
                {$set:{
                    'orderedProducts.$.deliveryDate':deliveryDate,
                    'orderedProducts.$.cancelledDate':null,
                    'orderedProducts.$.deliveredDate':null,
                    'orderedProducts.$.orderStatus':'on progress'
                }})
        }
        console.log("product status updated");
        res.redirect("/admin/orders")

    }
    catch(error){
        console.log(error,"error when changing status");
        res.redirect("/admin/orders")
    }
}

// bannerpage
exports.bannerPage = async function(req,res){
    try{
        const banners = await Banner.find({deletedAt:null});
        res.render("adminBanner",{banners})
    }
    catch(error){
        console.log("error when loading banner page",error);
    }
}

// UPLOAD banner page
exports.uploadBannerPage = function(req,res){
    res.render("addBanner")
}

//upload banner
exports.uploadBanner = async function(req,res){
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
        console.log("error when uploading banner to the db",error);
    }
}

// delete banner
exports.deleteBanner = async function(req,res){
    try{
        const bannerID = req.params.id;
        const softDelete = await Banner.updateOne({_id:bannerID},{$set:{deletedAt:new Date}});
        console.log("banner deleted");
        const banners = await Banner.find({default:null});
        res.json({message:"deleted",banners});
    }
    catch(error){
        console.log(error,"error when deleting banner");
    }
}


// page to edit banner
exports.editBannerPage = async function(req,res){
    try{
        const bannerID = req.params.id;
        const banner = await Banner.findById(bannerID)
        res.render("editBanner",{banner})
    }
    catch(error){
        console.log(error,"error when editing the banner");
    }
}

// edit banner post
exports.editBanner = async function(req,res){
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
        console.log("error when updating banner",error);
    }
}

// admin coupon page
exports.adminCouponPage = async function(req,res){
    try{
        const coupons = await Coupon.find();
        res.render("adminCoupon",{coupons})
    }
    catch(error){
        console.log("error when rendering coupon page");        
    }
}

// admin add coupon page
exports.addCouponPage = async function(req,res){
    try{
        const coupon = ''
        res.render('addEditCoupon',{coupon})
    }
    catch(error){
        console.log("error when rendering add coupon page",error);
    }
    
} 

// add the coupon
exports.addCoupon = async function(req,res){
    const {coupon_head,couponCode,minimumAmount,startDate,endDate,offerAmount} = req.body;
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
    try{
        await Coupon.findByIdAndUpdate(couponID,req.body);
        console.log("coupon edited");
        res.redirect('/admin/coupon')
    }
    catch(error){
        console.log("error when editing the offer",error);
        console.log("coupon edit failed");
        res.redirect('/admin/coupon')
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
exports.referralReward = async function(req,res){
    try{
        const rewards = await referralReward.findOne();
        res.render("adminReward",{rewards});

    }
    catch(error){
        console.log("error",error);
    }
}

// add - edit referral reward page
exports.referralRewardPage = async function(req,res){
    const action = req.params.action;
    try{
        if(action === "add"){
            const reward = ""
            res.render("addEditReferral",{title:'Add',reward});
        }
    }catch(error){
        console.log("error",error);
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
exports.salesReportPage = async function(req,res){
    try{
        const sortValue = req.query.sort;
        const filter = {};
        if(sortValue === "today"){
            const currentDate = new Date();
            currentDate.setHours(0,0,0,0);
            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23,59,59,999);

            // query for current date
            filter.orderedDate = {$gte:currentDate,$lte:endOfDay};
        }
        else if(sortValue === "lastWeek"){
            const startOfCurrentWeek = new Date();
            startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay());

            const endOfCurrentWeek = new Date(startOfCurrentWeek);
            endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 6);

            // querying for last week
            filter.orderedDate = {$gte:startOfCurrentWeek,$lte:endOfCurrentWeek}
        }
        else if(sortValue === "lastMonth"){
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);    //date seted for 1st day
            currentMonthStart.setHours(0,0,0,0);

            const currentMonthEnd = new Date(currentMonthStart);
            currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
            currentMonthEnd.setDate(0);
            currentMonthEnd.setHours(23,59,59,999);

            filter.orderedDate = {$gte:currentMonthStart,$lte:currentMonthEnd}
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

            filter.orderedDate = {$gte:currentYearStart,$lte:currentYearEnd};
        }
        else if(sortValue === "all"){

        }
        else if(sortValue){
            let dates = sortValue.split("/");
            const startDate = new Date(dates[0]);
            startDate.getHours(0,0,0,0);
            const endDate = new Date(dates[1]);
            endDate.setHours(23,59,59,999)

            filter.orderedDate = {$gte:startDate,$lte:endDate}
        }

        // caclulating total products and sales amount 
        const orders = await Order.find({...filter,orderStatus:{$ne:"cancelled"}})
            .populate("orderedProducts.productID")
            .populate("address")
            .sort({orderedDate:-1})
        console.log(orders);
        let totalSalesAmount = 0;
        let totalProducts = 0;
        let totalOrders = 0;
        let totalUsers = 0;
        let userID = "";
        
        orders.forEach(function(order){            
            if(order.orderStatus != "cancelled"){
                // calculating total order and total users                
                totalOrders += 1; 
                if(order.userID.toString() !== userID.toString()){
                    totalUsers += 1;
                    userID = order.userID;
                }
                
                order.orderedProducts.forEach(function(product){
                    if(product.orderStatus != 'cancelled'){
                        totalSalesAmount += product.totalPrice
                        totalProducts += 1;
                    }
                })
            }            
        })
        res.render("salesReport",{
            totalSalesAmount,
            totalProducts,
            totalUsers,
            totalOrders,
            orders
        });
    }
    catch(error){
        console.log("failed to log",error);
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
        worksheet.addRow(["S/N","Buyer","Product","Quantity","Size","Price","Order Date","Address","Payment Method"]);
        let sn = 0;
        orders.forEach(function(order){            
            order.orderedProducts.forEach(function(product){
                sn += 1;
                const address = `${order.address.name} ${order.address.address} ${order.address.district}`
                worksheet.addRow([
                    sn,
                    order.username,
                    `${product.productID.brand} ${product.productID.color} ${product.productID.productType}`,
                    product.quantity,
                    product.size,
                    product.totalPrice,
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
        const pdfdoc = new PDF();
        
        // setting header and piping the doc
        res.setHeader('Content-Disposition','attachment; filename="moasweb_salesReport.pdf"');
        pdfdoc.pipe(res);

        // setting the doc heading
        pdfdoc.fontSize(17).text('MOASWEB Sales Report',{align:"center"});
        pdfdoc.fontSize(16);

        let itemno = 0 
        let x = 50
        let y = 130
        orders.forEach(function(order){
            order.orderedProducts.forEach(function(product){
                itemno += 1;
                const date = new Date(order.orderedDate);
                pdfdoc.text(`${itemno}`,x,y);
                pdfdoc.text(`Purchased Product : ${product.productID.brand} ${product.productID.color} ${product.productID.productType}`,x,y+25)
                pdfdoc.text(`Purchased Date : ${date.toDateString()}`,x,y+45);
                pdfdoc.text(`Purchase Total : ${product.totalPrice}`,x,y+65)
                pdfdoc.text(`Purchased Quantity : ${product.quantity}`,x,y+85)
                pdfdoc.text(`Product Size : ${product.size}`,x,y+105);
                pdfdoc.text(`Payment Method : ${order.paymentMethod}`,x,y+125);
                pdfdoc.text(`Product delivery address : ${order.address.address}, ${order.address.district}`,x,y+145);
                pdfdoc.text(`Delivery address name : ${order.address.name}`,x,y+186);
                pdfdoc.text(`Purchase made through the account of ${order.username}`,x,y+206);
                
                y += 300
            })
            
        })
        console.log("pdf created");
        
        // end the pdf doc
        pdfdoc.end()
    }
    catch(error){
        console.log("server error",error);
        res.status(500).json({error:"server error"});
    }
}