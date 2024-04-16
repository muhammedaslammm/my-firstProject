const multer = require("multer");


// product image
const storage1 = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'public/images');
    },
    filename:function(req,file,cb){
        const uniqueCode = Math.round(Math.random() * 1E9);
        cb(null,file.fieldname + '-' + uniqueCode + '.webp');
    }
})

const upload = multer({
    storage:storage1
})

// banner storage
const bannerStorage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'public/wallpapers');
    },
    filename:function(req,file,cb){
        const uniqueCode = Math.floor(Math.random() * 1E9);
        cb(null,`${file.fieldname}-${uniqueCode}.webp`)
    }
})

const upload2 = multer({
    storage:bannerStorage
})

// product main image crop
const tempStore = multer.memoryStorage()
const uploadMem = multer({
    storage:tempStore
})


module.exports = {upload,upload2,uploadMem}