const express = require('express')
const app = express();
const nocache = require("nocache");
const Product = require("./../models/productModel");
const Category = require("./../models/categoryModel");
const Address = require("./../models/addressModel");


exports.landingPage = function(req,res){
    res.redirect("/home")
}

// search result
exports.searchResult = async function(req,res){
    try{
        const userID = req.session.userID;
        const searchKeyword = req.query.q;
        const categories = await Category.distinct('category',{deletedAt:null});
        const brands = await Product.distinct('brand',{deletedAt:null});
        const {brand,size,price,color,rating,discount,sort} = req.query;
        const category = req.params.categoryName

        filters = {}

        if(brand) filters.brand = brand;
        if(size) filters[size] = {$gt:0};
        if(rating) filters.rating = rating;
        if(discount) filters.discount = discount;      
        
        if(category) filters.category = category;
        if(color){
            const colorMatch = new RegExp(color,"i");
            filters.color = colorMatch;
        }
        
        if(price){
            const priceRange = price.split("-");
            filters.sellingPrice = {$gte:parseInt(priceRange[0]),$lte:parseInt(priceRange[1])};
        }       

        let sortQuery;
        switch(sort){
            case 'popularity':
                sortQuery = {popularity:-1};
                break;
            case 'new':
                sortQuery = {date:1};
                break;
            case 'low-high':
                sortQuery = {sellingPrice:1};
                break;
            case 'high-low':
                sortQuery = {sellingPrice:-1};
                break;
            case 'name-asc':
                sortQuery = {brand:1};
                break;
            case 'name-desc':
                sortQuery = {brand:-1};
                break;    
            default:
                sortQuery = {date:-1}
        }   

        const searchWords = searchKeyword.split(" ");
        const pipeline = []
        
        pipeline.push(
            {$match:{
                $and:[
                    {
                        $and:searchWords.map(function(word){
                            return {
                                $or:[
                                    { brand:{ $regex:word , $options:'i'}},
                                    { color:{ $regex:word , $options:'i'}},
                                    { pattern:{ $regex:word , $options:'i'}},
                                    { sleeve:{ $regex:word , $options:'i'}},
                                    { fabric:{ $regex:word , $options:'i'}},
                                    { productType:{ $regex:`\\b${word}\\b` , $options:'i'}},
                                ]
                            }
                        })
                    },
                    {...filters},
                ]
            }}
        )
        

        const currentPage = req.query.page || 1;
        const productPerPage = 12;        
        const skip = (currentPage-1)*12;

        const searchResult = await Product.aggregate(pipeline);
        const totalProducts = searchResult.length;
        console.log(totalProducts);
            
        pipeline.push({$sort:sortQuery})
        pipeline.push({$skip:skip});
        pipeline.push({$limit:productPerPage});


        const products = await Product.aggregate(pipeline);
        const count = products.length;
        const totalPages = Math.ceil(totalProducts/productPerPage)
        res.render("products",{userID,products,categories,brands,query:req.query,params:req.params,count,totalPages,currentPage})
        
    }catch(error){
        console.log("error when querying search",error);
    }
}

// products list 
exports.products = async function(req,res){
    try{
        const userID = req.session.userID;        
        const {brand,size,price,color,rating,discount,sort} = req.query; 
        const category = req.params.categoryName;     
        
        const categories = await Category.distinct('category',{deletedAt:null});
        const brands = await Product.distinct('brand',{deletedAt:null});
        
        filters = {}

        if(brand) filters.brand = brand;        
        if(rating) filters.rating = rating;
        if(discount) filters.discount = discount;      
        
        if(category) filters.category = category;

        if(size) filters[size] = {$gt:0};


        if(color){
            const colorMatch = new RegExp(color,"i");
            filters.color = colorMatch;
        }
        
        if(price){
            const priceRange = price.split("-");
            filters.sellingPrice = {$gte:parseInt(priceRange[0]),$lte:parseInt(priceRange[1])};
        }       

        let sortQuery;
        switch(sort){
            case 'popularity':
                sortQuery = {popularity:-1};
                break;
            case 'new':
                sortQuery = {date:-1};
                break;
            case 'low-high':
                sortQuery = {sellingPrice:1};
                break;
            case 'high-low':
                sortQuery = {sellingPrice:-1};
                break;
            case 'name-asc':
                sortQuery = {brand:1};
                break;
            case 'name-desc':
                sortQuery = {brand:-1};
                break;    
            default:
                sortQuery = {date:-1}
        }   
        filters.deletedAt = null;

        // pagination
        const productPerPage = 12;
        const currentPage = req.query.page || 1;

        const products = await Product.find(filters)
        .sort(sortQuery)
        .skip((currentPage-1)*productPerPage)
        .limit(productPerPage)

        const totalProducts = await Product.countDocuments({category});
        const totalPages = Math.ceil(totalProducts/productPerPage);

        const count = products.length;
        res.render("products",{products,userID,count,categories,brands,query:req.query,params:req.params,count,currentPage,totalPages})
    
    }
    catch(error){
        console.log("server error",error);
    }
}

// product page
exports.selectedProduct = async function(req,res){
    try{
        const productID = req.params.id;
        const category = req.params.category;
        const userID = req.session.userID;
        const product = await Product.findById(productID);
        res.render("selectedProduct",{product,userID});

    }catch(error){
        console.log("server error",error);
        res.redirect("/category/Tops")
    }
}

exports.getQuantity = async function(req,res){
    try{
        const size = req.query.size
        const productID = req.params.productID;
        const product = await Product.findById(productID);
        const quantity = product[size];
        res.status(200).json({quantity});
    }
    catch(error){
        console.log("error when fetching quantity server side",error);
        res.status(500).json({error:"fetching quantity failed"})
    }
}




// add-to-cart or buy now button click
exports.buttonClick = async function(req,res){
    try{
        const userID = req.session.userID;
        const productID = req.params.id;
        const product =  await Product.findById(productID)
        const quantity = req.body.quantity;
        const size = req.body.size;
        const address = await Address.find({userID});

        if(req.body.button === "addToCart"){
            if(!address.length > 0){
                res.redirect(`/product-addAddress?productID=${productID}&quantity=${quantity}&size=${size}`)
            }
            else{
                res.redirect(`/product-addToCart?productID=${productID}&quantity=${quantity}&size=${size}`);
            }
            
        }
        else if(req.body.button === 'viewCart'){
            res.redirect(`/cart-page`)
        }
        else if(req.body.button === "buyProduct"){
            res.redirect(`/product-buyProduct?productID=${productID}&quantity=${quantity}&size=${size}`);
        }
        
    }
    catch(error){
        console.log("error occured",error);
    }
    
}

// product address page
exports.product_addAddress = async function(req,res){
    try{
        const {productID,quantity,size} = req.query;
        const userID = req.session.userID;
        res.render("productAddress",{userID,productID,quantity,size})
    }
    catch(error){
        console.log(error,"error when rendering address page from product");
    }
}

// address post
exports.addProduct_Address = async function(req,res){
    try{
        const address = req.body;
        address.userID = req.session.userID;
        const {productID,quantity,size}=req.query;
        const addAddress = await Address.create(address);
        await Address.updateMany({},{$set:{default:false}});
        await Address.updateOne({_id:addAddress._id},{$set:{default:true}});
        res.redirect(`/product-addToCart?productID=${productID}&quantity=${quantity}&size=${size}`)

    }
    catch(error){
        console.log(error,"error whaen uploading address");
    }
}

