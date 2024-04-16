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
const Offer = require("./../models/offerModel");


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

        const currentPage = page;
        const totalProducts = await Product.countDocuments()
        const totalPages = Math.ceil(totalProducts/productPerPage);
        console.log(totalPages);
        console.log(typeof currentPage);
        console.log(currentPage);
        
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

// admin order page
exports.orderPage = async function(req,res){
    try{
        const userID = req.session.userID;
        const orders = await Order.aggregate([
            {$match:{userID:userID}},
            {$unwind:"$orderedProducts"},
            {
                $lookup:{
                    from:"addresses",
                    localField:"address",
                    foreignField:"_id",
                    as:"deliveryAddress"
                }
            },
            {$project:{
                _id:1,
                username:1,
                orderedDate:1,
                orderedProduct:"$orderedProducts",
                address:{$arrayElemAt:["$deliveryAddress",0]}
            }}
            
        ])    
        console.log(orders);
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
        const {orderID,cartID,productID} = req.params;
        const status = req.body.status ;     
        await Order.updateOne({_id:orderID,'orderedProducts.productID':productID},{$set:{'orderedProducts.$.orderStatus':status}})
        
        if(status === 'delivered'){
            const deleteFromCart = await Cart.deleteOne({_id:cartID,productID})
            const editProduct = await Product.findByIdAndUpdate({_id:productID},{addedToCart:false})            
            await Order.updateOne(
                {_id:orderID,'orderedProducts.productID':productID},
                {$set:{
                    'orderedProducts.$.deliveredDate':new Date(),
                    'orderedProducts.$.cancelledDate':null,
                    'orderedProducts.$.deliveryDate':null}
                });            
        }
        else if(status === 'cancelled'){
            await Order.updateOne(
                {_id:orderID,'orderedProducts.productID':productID},
                {$set:{
                    'orderedProducts.$.cancelledDate':new Date(),
                    'orderedProducts.$.deliveredDate':null,
                    'orderedProducts.$.deliveryDate':null
                }})
        }
        else if(status === 'on progress'){
            const date = new Date();
            const newDate = date.setDate(date.getDate() + 3)
            const deliveryDate = new Date(newDate)
            await Order.updateOne(
                {_id:orderID,'orderedProducts.productID':productID},
                {$set:{
                    'orderedProducts.$.deliveryDate':deliveryDate,
                    'orderedProducts.$.cancelledDate':null,
                    'orderedProducts.$.deliveredDate':null
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

// admin offer page
exports.offerPage = async function(req,res){
    try{
        const offers = await Offer.find();
        res.render("adminOffers",{offers});
    }
    catch(error){
        console.log(error,"error in admin offers page");        
    }
}

// add offer page
exports.addOfferPage = async function(req,res){
    try{     
        const categories = await Category.find({deletedAt:null}); 
        res.render('addOffer',{categories})
    }
    catch(error){
        console.log("error when fetching offers",error);
    }
}

// get product based on category for adding offer;
exports.getProducts = async function(req,res){
    const category = req.body.category;
    try{
        const products = await Product.find({category});
        res.json({products});
    }
    catch(error){
        console.log('error when dealing with fetching product based on category in server side...',error);
        res.json({error:"server error"});
    }
}